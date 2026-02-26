import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

const DEFAULT_COUNTRIES: Country[] = [
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
];
const LEGACY_STORAGE_KEY = 'gp_countries';

@Injectable({ providedIn: 'root' })
export class CountryStore {
  private supabase = inject(SupabaseService);
  private _countries = signal<Country[]>([]);

  constructor() {
    void this.reload();
  }

  readonly all = this._countries.asReadonly();

  getByCode(code: string): Country | undefined {
    return this._countries().find((c) => c.code === code);
  }

  /** Returns a display string like "🇻🇪 Venezuela, 🇨🇴 Colombia" for an array of codes */
  getNames(codes: string[]): string {
    return codes
      .map((c) => this.getByCode(c))
      .filter(Boolean)
      .map((c) => `${c!.flag} ${c!.name}`)
      .join(', ');
  }

  async add(country: Country): Promise<boolean> {
    const code = country.code.trim().toUpperCase();
    if (!code || !country.name.trim()) return false;
    if (this._countries().some((c) => c.code === code)) return false;
    const nextCountry: Country = { code, name: country.name.trim(), flag: country.flag.trim() || code };
    this._countries.update((list) => [
      ...list,
      nextCountry,
    ]);
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._countries.update((list) => list.filter((c) => c.code !== code));
      return false;
    }
    const { error } = await client.from('countries').insert({
      code: nextCountry.code,
      name: nextCountry.name,
      flag: nextCountry.flag,
      is_active: true,
    });
    if (error) {
      this._countries.update((list) => list.filter((c) => c.code !== code));
      return false;
    }
    return true;
  }

  async remove(code: string): Promise<boolean> {
    const prev = this._countries();
    this._countries.update((list) => list.filter((c) => c.code !== code));
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._countries.set(prev);
      return false;
    }
    const { error } = await client.from('countries').delete().eq('code', code);
    if (error) {
      this._countries.set(prev);
      return false;
    }
    return true;
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      if (this._countries().length === 0) {
        this._countries.set(DEFAULT_COUNTRIES);
      }
      return;
    }
    const { data, error } = await client
      .from('countries')
      .select('code,name,flag')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) {
      if (this._countries().length === 0) {
        this._countries.set(DEFAULT_COUNTRIES);
      }
      return;
    }
    if (!data || data.length === 0) {
      const legacy = this.readLegacyCountries();
      const seedCountries = legacy.length > 0 ? legacy : DEFAULT_COUNTRIES;
      await client.from('countries').upsert(
        seedCountries.map((c) => ({
          code: c.code,
          name: c.name,
          flag: c.flag,
          is_active: true,
        })),
        { onConflict: 'code' }
      );
      this._countries.set(seedCountries);
      return;
    }
    this._countries.set(
      data.map((row) => ({
        code: String(row.code),
        name: String(row.name),
        flag: String(row.flag ?? row.code),
      }))
    );
  }

  private readLegacyCountries(): Country[] {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Country[];
      if (!Array.isArray(parsed)) return [];
      const dedup = new Map<string, Country>();
      for (const c of parsed) {
        const code = String(c.code ?? '').trim().toUpperCase();
        const name = String(c.name ?? '').trim();
        const flag = String(c.flag ?? '').trim() || code;
        if (!code || !name) continue;
        dedup.set(code, { code, name, flag });
      }
      return [...dedup.values()];
    } catch {
      return [];
    }
  }
}
