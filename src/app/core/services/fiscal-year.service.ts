import { Injectable, inject, signal, computed } from '@angular/core';
import type { FiscalYear } from '../../shared/models/fiscal-year.model';
import { SupabaseService } from './supabase.service';

interface FiscalYearRow {
  key: string;
  label: string;
  start_date: string;
  end_date: string | null;
  period_number: number;
  is_current: boolean;
}

const DEFAULT_STATE = createDefaultFiscalYear();
const LEGACY_PERIOD_STATE_KEY = 'gp_period_state';

@Injectable({ providedIn: 'root' })
export class FiscalYearService {
  private supabase = inject(SupabaseService);
  private _state = signal<FiscalYear>(DEFAULT_STATE);
  private _periodNumber = signal<number>(1);

  constructor() {
    void this.reload();
  }

  /** Current period derived from last closure state */
  readonly currentFiscalYear = computed<FiscalYear>(() => {
    return this._state();
  });

  /** Advance to next period when current one is closed */
  async advancePeriod(closedAtIso: string): Promise<FiscalYear> {
    const current = this._state();
    const nextPeriodNumber = this._periodNumber() + 1;
    const next: FiscalYear = {
      key: this.computeNextKey(current.key),
      label: `Período ${nextPeriodNumber}`,
      startDate: new Date(closedAtIso),
      endDate: new Date(),
      isCurrent: true,
    };
    const prev = current;
    const prevNumber = this._periodNumber();
    this._state.set(next);
    this._periodNumber.set(nextPeriodNumber);
    try {
      await this.persistAdvance(prev, next, closedAtIso, nextPeriodNumber);
    } catch {
      this._state.set(prev);
      this._periodNumber.set(prevNumber);
    }
    return this.currentFiscalYear();
  }

  /** Returns what key would be used for the next period */
  getNextPeriodKey(): string {
    return this.computeNextKey(this._state().key);
  }

  private computeNextKey(currentKey: string): string {
    const rangeMatch = currentKey.match(/^FY(\d+)-(\d+)$/);
    if (rangeMatch) {
      return `FY${Number(rangeMatch[1]) + 1}-${Number(rangeMatch[2]) + 1}`;
    }
    const yearMatch = currentKey.match(/^FY(\d+)$/);
    if (yearMatch) {
      return `FY${Number(yearMatch[1]) + 1}`;
    }
    const trailingNumber = currentKey.match(/(.*?)(\d+)$/);
    if (trailingNumber) {
      const prefix = trailingNumber[1];
      const n = Number(trailingNumber[2]) + 1;
      return `${prefix}${n}`;
    }
    return `${currentKey}-NEXT`;
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('FiscalYearService.reload() failed:', err);
      this._state.set(DEFAULT_STATE);
      this._periodNumber.set(1);
      return;
    }
    const { data, error } = await client
      .from('fiscal_years')
      .select('key,label,start_date,end_date,period_number,is_current')
      .eq('is_current', true)
      .order('period_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('FiscalYearService.reload() failed:', error);
      this._state.set(DEFAULT_STATE);
      this._periodNumber.set(1);
      return;
    }
    if (!data) {
      const legacy = this.readLegacyState();
      const seed = legacy?.year ?? DEFAULT_STATE;
      const periodNumber = legacy?.periodNumber ?? 1;
      await client.from('fiscal_years').upsert({
        key: seed.key,
        label: seed.label,
        start_date: seed.startDate.toISOString(),
        end_date: null,
        period_number: periodNumber,
        is_current: true,
      }, { onConflict: 'key' });
      this._state.set(seed);
      this._periodNumber.set(periodNumber);
      return;
    }
    const row = data as FiscalYearRow;
    this._state.set({
      key: row.key,
      label: row.label || 'Período Actual',
      startDate: new Date(row.start_date),
      endDate: new Date(),
      isCurrent: true,
    });
    this._periodNumber.set(Number(row.period_number) || 1);
  }

  private async persistAdvance(
    prev: FiscalYear,
    next: FiscalYear,
    closedAtIso: string,
    nextPeriodNumber: number
  ): Promise<void> {
    const client = this.supabase.requireClient();
    const prevUpdate = await client
      .from('fiscal_years')
      .update({ is_current: false, end_date: closedAtIso })
      .eq('key', prev.key)
      .eq('is_current', true);
    if (prevUpdate.error) {
      throw prevUpdate.error;
    }
    const nextInsert = await client.from('fiscal_years').upsert(
      {
        key: next.key,
        label: next.label,
        start_date: next.startDate.toISOString(),
        end_date: null,
        period_number: nextPeriodNumber,
        is_current: true,
      },
      { onConflict: 'key' }
    );
    if (nextInsert.error) {
      throw nextInsert.error;
    }
  }

  private readLegacyState(): { year: FiscalYear; periodNumber: number } | null {
    try {
      const raw = localStorage.getItem(LEGACY_PERIOD_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        currentKey?: string;
        currentStart?: string;
        periodNumber?: number;
      };
      if (!parsed.currentKey || !parsed.currentStart) return null;
      return {
        year: {
          key: String(parsed.currentKey),
          label: 'Período Actual',
          startDate: new Date(parsed.currentStart),
          endDate: new Date(),
          isCurrent: true,
        },
        periodNumber: Number(parsed.periodNumber) > 0 ? Number(parsed.periodNumber) : 1,
      };
    } catch {
      return null;
    }
  }
}

function createDefaultFiscalYear(): FiscalYear {
  return {
    key: `FY${new Date().getFullYear()}`,
    label: 'Período Actual',
    startDate: new Date(),
    endDate: new Date(),
    isCurrent: true,
  };
}
