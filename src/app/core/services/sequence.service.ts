import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'gp_seq_counters';

/**
 * Generates sequential Jira-style IDs per team code (e.g. TI-001, OPS-002).
 * Counters are persisted in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SequenceService {
  private _counters = signal<Record<string, number>>(this.load());

  /** Get the next sequential ID for a team code, e.g. "TI-016" */
  next(teamCode: string): string {
    const code = this.normalizeCode(teamCode);
    const current = this._counters()[code] ?? 0;
    const next = current + 1;
    this._counters.update((m) => ({ ...m, [code]: next }));
    this.persist();
    return `${code}-${String(next).padStart(3, '0')}`;
  }

  /** Seed a counter to a specific value (used by mock data) */
  seed(teamCode: string, value: number): void {
    const code = this.normalizeCode(teamCode);
    const current = this._counters()[code] ?? 0;
    if (value > current) {
      this._counters.update((m) => ({ ...m, [code]: value }));
      this.persist();
    }
  }

  private normalizeCode(teamCode: string | undefined | null): string {
    if (!teamCode) return 'GP';
    return teamCode.toUpperCase();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._counters()));
    } catch { /* ignore */ }
  }

  private load(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch { /* ignore */ }
    return {};
  }
}
