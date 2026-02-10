import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { ThemeService } from '../../services/theme.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
         style="background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 50%, #db2777 100%)">
      <!-- Decorative blurred shapes -->
      <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>

      <div class="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl"
           style="background:var(--surface);border-color:var(--border)">

        <!-- Logo -->
        <div class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white text-xl font-bold shadow-lg">
          GP
        </div>

        <h1 class="text-center text-2xl font-bold tracking-tight" style="color:var(--on-surface)">
          {{ 'login.title' | translate }}
        </h1>
        <p class="mt-2 text-center text-sm" style="color:var(--muted)">
          {{ 'login.subtitle' | translate }}
        </p>

        <!-- Google login -->
        <button
          (click)="auth.loginWithGoogle()"
          class="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-md"
          style="background:var(--surface);border-color:var(--border);color:var(--on-surface)"
        >
          <!-- Google SVG -->
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {{ 'login.google' | translate }}
        </button>

        <!-- Dev mode -->
        <div class="mt-8 border-t pt-6" style="border-color:var(--border)">
          <p class="mb-4 flex items-center justify-center gap-2 text-xs font-medium" style="color:var(--muted)">
            <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">DEV</span>
            {{ 'login.devMode' | translate }}
          </p>
          <div class="flex gap-3">
            <button
              (click)="loginAs('functional')"
              class="flex-1 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-solid"
              style="border-color:var(--border);color:var(--on-surface)"
            >
              {{ 'login.asFunctional' | translate }}
            </button>
            <button
              (click)="loginAs('developer')"
              class="flex-1 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-solid"
              style="border-color:var(--border);color:var(--on-surface)"
            >
              {{ 'login.asDeveloper' | translate }}
            </button>
          </div>
        </div>

        <!-- Theme toggle on login page -->
        <div class="mt-6 flex justify-center">
          <button (click)="theme.toggle()" class="rounded-full p-2 transition-colors hover:bg-accent/10" style="color:var(--muted)">
            @if (theme.isDark()) {
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
            } @else {
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);

  loginAs(role: 'functional' | 'developer'): void {
    this.auth.loginAs(role);
  }
}
