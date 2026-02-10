import { Injectable, signal } from '@angular/core';

export type LocaleId = 'es' | 'en';
const STORAGE_KEY = 'gp-locale';
const DEFAULT: LocaleId = 'es';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _locale = signal<LocaleId>(this.loadStored());
  private _dict = signal<Record<string, unknown>>({});

  readonly locale = this._locale.asReadonly();
  /** Exposed for the impure translate pipe to register reactivity. */
  readonly dict = this._dict.asReadonly();

  constructor() {
    this.load(this._locale());
  }

  setLocale(lang: LocaleId): void {
    this._locale.set(lang);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    this.load(lang);
  }

  /** Resolve a dot-notation key against the loaded dictionary. */
  t(key: string): string {
    const parts = key.split('.');
    let cur: unknown = this._dict();
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === 'string' ? cur : key;
  }

  private loadStored(): LocaleId {
    if (typeof localStorage === 'undefined') return DEFAULT;
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'en' ? 'en' : 'es';
  }

  private load(lang: LocaleId): void {
    fetch(`/assets/i18n/${lang}.json`)
      .then((r) => r.json())
      .then((d) => this._dict.set(d))
      .catch(() => this._dict.set({}));
  }
}
