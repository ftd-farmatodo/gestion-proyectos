import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'gp-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<ThemeMode>(this.loadStored());

  readonly theme = this._theme.asReadonly();

  readonly isDark = computed(() => {
    const mode = this._theme();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  constructor() {
    // Apply immediately to prevent FOUC
    this.applyClass(this.isDark());
    // React to subsequent theme changes
    effect(() => this.applyClass(this.isDark()));

    if (typeof window !== 'undefined') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this._theme() === 'system') this.applyClass(this.isDark());
        });
    }
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private loadStored(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'system';
    const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  }

  private applyClass(dark: boolean): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', dark);
  }
}
