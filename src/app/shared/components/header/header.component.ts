import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService, LocaleId } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <!-- Mobile hamburger -->
    <button
      (click)="mobileOpen.set(!mobileOpen())"
      class="fixed left-4 top-4 z-50 rounded-lg p-2 lg:hidden"
      style="background:var(--surface);color:var(--on-surface)"
    >
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        @if (mobileOpen()) {
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        } @else {
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        }
      </svg>
    </button>

    <!-- Overlay for mobile -->
    @if (mobileOpen()) {
      <div class="fixed inset-0 z-30 bg-black/30 lg:hidden" (click)="mobileOpen.set(false)"></div>
    }

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0"
      [class.-translate-x-full]="!mobileOpen()"
      [class.translate-x-0]="mobileOpen()"
      style="background:var(--surface);border-color:var(--border)"
    >
      <!-- Brand -->
      <div class="flex h-16 items-center gap-3 border-b px-5" style="border-color:var(--border)">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">GP</div>
        <span class="text-sm font-semibold" style="color:var(--on-surface)">{{ 'header.brand' | translate }}</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 px-3 py-4">
        <a
          routerLink="/dashboard"
          routerLinkActive="bg-accent/10 text-accent font-semibold"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5"
          style="color:var(--on-surface)"
          (click)="mobileOpen.set(false)"
        >
          <!-- Dashboard icon -->
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
          </svg>
          {{ 'header.dashboard' | translate }}
        </a>

        <a
          routerLink="/submissions"
          routerLinkActive="bg-accent/10 text-accent font-semibold"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5"
          style="color:var(--on-surface)"
          (click)="mobileOpen.set(false)"
        >
          <!-- Submissions icon -->
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
          </svg>
          {{ 'header.submissions' | translate }}
        </a>

        @if (auth.hasRole(['developer', 'admin'])) {
          <a
            routerLink="/prioritization"
            routerLinkActive="bg-accent/10 text-accent font-semibold"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5"
            style="color:var(--on-surface)"
            (click)="mobileOpen.set(false)"
          >
            <!-- Matrix icon -->
            <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
            </svg>
            {{ 'header.prioritization' | translate }}
          </a>
        }
      </nav>

      <!-- Footer: theme, lang, user -->
      <div class="space-y-3 border-t px-4 py-4" style="border-color:var(--border)">
        <!-- Theme toggle -->
        <button (click)="theme.toggle()" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5" style="color:var(--muted)">
          @if (theme.isDark()) {
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
          } @else {
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          }
          {{ 'header.theme' | translate }}
        </button>

        <!-- Language selector -->
        <button (click)="toggleLang()" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5" style="color:var(--muted)">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/>
          </svg>
          {{ i18n.locale() === 'es' ? 'EN' : 'ES' }}
        </button>

        <!-- User info -->
        @if (auth.user(); as user) {
          <div class="flex items-center gap-3 rounded-lg px-3 py-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold" style="background:var(--accent);color:white">
              {{ (user.display_name ?? user.email).charAt(0) }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="truncate text-sm font-medium" style="color:var(--on-surface)">{{ user.display_name ?? user.email }}</p>
              <p class="truncate text-xs" style="color:var(--muted)">{{ user.role }}</p>
            </div>
          </div>
          <button
            (click)="auth.logout()"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
            </svg>
            {{ 'common.logout' | translate }}
          </button>
        }
      </div>
    </aside>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  i18n = inject(I18nService);
  mobileOpen = signal(false);

  toggleLang(): void {
    this.i18n.setLocale(this.i18n.locale() === 'es' ? 'en' : 'es');
  }
}
