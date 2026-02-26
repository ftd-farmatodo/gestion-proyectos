import { Injectable, signal } from '@angular/core';
import esDict from '../../../assets/i18n/es.json';

export type LocaleId = 'es';
const DEFAULT: LocaleId = 'es';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _locale = signal<LocaleId>(DEFAULT);
  private _dict = signal<Record<string, unknown>>(esDict as Record<string, unknown>);

  readonly locale = this._locale.asReadonly();
  /** Exposed for the impure translate pipe to register reactivity. */
  readonly dict = this._dict.asReadonly();

  constructor() {}

  setLocale(lang: LocaleId): void {
    this._locale.set(lang);
    this._dict.set(esDict as Record<string, unknown>);
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

}
