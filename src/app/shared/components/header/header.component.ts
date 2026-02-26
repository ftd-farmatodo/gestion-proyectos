import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BacklogReadTrackerService } from '../../../core/services/backlog-read-tracker.service';
import { ActivityStoreService } from '../../../core/services/activity-store.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { TeamStore } from '../../../core/services/team-store.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <!-- ══════════════ DESKTOP FLOATING PILL (lg+) ══════════════ -->
    <nav class="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-pill items-center gap-1 px-2 py-1.5 animate-fade-in">

      <!-- Brand -->
      <a routerLink="/dashboard" class="flex items-center gap-2 px-2 mr-1">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center">
          <img src="assets/icon_ftd.png" alt="Farmatodo" class="w-full h-full object-contain drop-shadow-sm" />
        </div>
      </a>

      <div class="h-5 w-px mx-1" style="background: var(--border); opacity: 0.5"></div>

      <!-- Nav links -->
      <a routerLink="/dashboard" routerLinkActive="pill-active"
         [routerLinkActiveOptions]="{exact: true}"
         class="pill-link">
        <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
        </svg>
        <span class="pill-label">{{ 'header.dashboard' | translate }}</span>
      </a>

      <a routerLink="/submissions" routerLinkActive="pill-active"
         class="pill-link">
        <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
        <span class="pill-label">{{ 'header.submissions' | translate }}</span>
      </a>

      @if (auth.hasRole(['developer', 'admin'])) {
        <a routerLink="/backlog" routerLinkActive="pill-active"
           class="pill-link">
          <div class="relative">
            <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
            @if (backlogTracker.unreadCount() > 0) {
              <span class="absolute -top-1.5 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none text-white"
                    style="background: var(--magenta)">
                {{ backlogTracker.unreadCount() > 99 ? '99+' : backlogTracker.unreadCount() }}
              </span>
            }
          </div>
          <span class="pill-label">{{ 'header.backlog' | translate }}</span>
        </a>

        <a routerLink="/prioritization" routerLinkActive="pill-active"
           class="pill-link">
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
          </svg>
          <span class="pill-label">{{ 'header.prioritization' | translate }}</span>
        </a>

        <a routerLink="/tracking" routerLinkActive="pill-active"
           class="pill-link">
          <div class="relative">
            <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            @if (activityStore.activeBlockerCount() > 0) {
              <span class="absolute -top-1.5 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none text-white blocker-badge"
                    style="background: var(--orange)">
                {{ activityStore.activeBlockerCount() > 99 ? '99+' : activityStore.activeBlockerCount() }}
              </span>
            }
          </div>
          <span class="pill-label">{{ 'header.tracking' | translate }}</span>
        </a>
      }

      <a routerLink="/history" routerLinkActive="pill-active"
         class="pill-link">
        <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
        </svg>
        <span class="pill-label">{{ 'header.history' | translate }}</span>
      </a>

      <div class="h-5 w-px mx-1" style="background: var(--border); opacity: 0.5"></div>

      <!-- Context selectors -->
      <select class="context-select"
              [value]="appContext.activeTeamId()"
              [disabled]="!canSwitchTeams()"
              (change)="onTeamChange($event)">
        @for (team of teamStore.activeTeams(); track team.id) {
          <option [value]="team.id">{{ team.icon ? team.icon + ' ' : '' }}{{ team.name }}</option>
        }
      </select>

      @if (appContext.isReadOnly()) {
        <span class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style="background: color-mix(in srgb, var(--orange) 15%, transparent); color: var(--orange)">
          {{ 'header.readOnly' | translate }}
        </span>
      }

      @if (auth.hasRole(['admin'])) {
        <a routerLink="/settings" routerLinkActive="pill-active" class="pill-link" [attr.aria-label]="'settings.title' | translate">
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </a>
      }

      <div class="h-5 w-px mx-1" style="background: var(--border); opacity: 0.5"></div>

      <!-- Controls -->
      <button (click)="theme.toggle()" class="pill-btn" [title]="'header.theme' | translate" [attr.aria-label]="'header.theme' | translate">
        @if (theme.isDark()) {
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
          </svg>
        } @else {
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
          </svg>
        }
      </button>


      <!-- User avatar + dropdown -->
      @if (auth.user(); as user) {
        <div class="relative">
          <button (click)="userMenuOpen.set(!userMenuOpen())"
                  [attr.aria-label]="'header.userMenu' | translate"
                  class="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-all hover:ring-2 hover:ring-offset-1"
                  style="background: var(--accent); color: white; --tw-ring-color: var(--accent); --tw-ring-offset-color: transparent">
            {{ (user.display_name ?? user.email).charAt(0) }}
          </button>

          @if (userMenuOpen()) {
            <div class="absolute right-0 top-full mt-2 w-56 glass-dropdown animate-fade-in"
                 (click)="$event.stopPropagation()">
              <div class="px-3 py-2.5 border-b" style="border-color: color-mix(in srgb, var(--border) 50%, transparent)">
                <p class="text-sm font-semibold truncate" style="color: var(--on-surface)">{{ user.display_name ?? user.email }}</p>
                <p class="text-[11px] mt-0.5" style="color: var(--muted)">{{ user.role }}</p>
              </div>
              <button (click)="onLogout()"
                      class="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style="color: var(--magenta)">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
                </svg>
                {{ 'common.logout' | translate }}
              </button>
            </div>
          }
        </div>
      }
    </nav>

    <!-- Desktop user-menu overlay to close -->
    @if (userMenuOpen()) {
      <div class="hidden lg:block fixed inset-0 z-40" (click)="userMenuOpen.set(false)"></div>
    }

    <!-- ══════════════ MOBILE FLOATING PILL (< lg) ══════════════ -->
    <nav class="lg:hidden fixed bottom-4 left-4 right-4 z-50 glass-pill flex items-center justify-around px-2 py-1 animate-slide-up">

      <a routerLink="/dashboard" routerLinkActive="pill-mob-active"
         [routerLinkActiveOptions]="{exact: true}"
         class="pill-mob-link">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
        </svg>
        <span class="pill-mob-label">{{ 'header.dashboard' | translate }}</span>
      </a>

      <a routerLink="/submissions" routerLinkActive="pill-mob-active"
         class="pill-mob-link">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
        <span class="pill-mob-label">{{ 'header.submissions' | translate }}</span>
      </a>

      @if (auth.hasRole(['developer', 'admin'])) {
        <a routerLink="/backlog" routerLinkActive="pill-mob-active"
           class="pill-mob-link">
          <div class="relative">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
            @if (backlogTracker.unreadCount() > 0) {
              <span class="absolute -top-1.5 -right-2.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none text-white"
                    style="background: var(--magenta)">
                {{ backlogTracker.unreadCount() > 99 ? '99+' : backlogTracker.unreadCount() }}
              </span>
            }
          </div>
          <span class="pill-mob-label">{{ 'header.backlog' | translate }}</span>
        </a>
      }

      <!-- More button -->
      <button (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              [attr.aria-label]="'header.more' | translate"
              class="pill-mob-link">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
        </svg>
        <span class="pill-mob-label">Más</span>
      </button>
    </nav>

    <!-- ══════════════ MOBILE "MORE" SHEET ══════════════ -->
    @if (mobileMenuOpen()) {
      <div class="fixed inset-0 z-40 lg:hidden" (click)="mobileMenuOpen.set(false)">
        <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

        <div class="absolute bottom-24 left-4 right-4 glass-dropdown animate-slide-up p-2"
             (click)="$event.stopPropagation()">

          @if (auth.user(); as user) {
            <div class="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl" style="background: color-mix(in srgb, var(--accent) 8%, transparent)">
              <div class="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                   style="background: var(--accent); color: white">
                {{ (user.display_name ?? user.email).charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="truncate text-sm font-semibold" style="color: var(--on-surface)">{{ user.display_name ?? user.email }}</p>
                <p class="truncate text-[11px]" style="color: var(--muted)">{{ user.role }}</p>
              </div>
            </div>
          }

          <!-- Context selectors (mobile) -->
          <div class="px-3 py-2">
            <select class="gp-select gp-select-sm text-xs w-full"
                    [value]="appContext.activeTeamId()"
                    [disabled]="!canSwitchTeams()"
                    (change)="onTeamChange($event)">
              @for (team of teamStore.activeTeams(); track team.id) {
                <option [value]="team.id">{{ team.name }}</option>
              }
            </select>
          </div>
          @if (appContext.isReadOnly()) {
            <div class="mx-3 mb-2 rounded-lg px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider"
                 style="background: color-mix(in srgb, var(--orange) 12%, transparent); color: var(--orange)">
              {{ 'header.readOnly' | translate }}
            </div>
          }
          <div class="my-1 mx-2 border-t" style="border-color: color-mix(in srgb, var(--border) 50%, transparent)"></div>

          @if (auth.hasRole(['developer', 'admin'])) {
            <a routerLink="/prioritization" (click)="mobileMenuOpen.set(false)"
               class="mobile-sheet-item">
              <svg class="h-5 w-5" style="color: var(--orange)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
              </svg>
              {{ 'header.prioritization' | translate }}
            </a>
            <a routerLink="/tracking" (click)="mobileMenuOpen.set(false)"
               class="mobile-sheet-item">
              <div class="relative">
                <svg class="h-5 w-5" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                @if (activityStore.activeBlockerCount() > 0) {
                  <span class="absolute -top-1 -right-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none text-white"
                        style="background: var(--orange)">
                    {{ activityStore.activeBlockerCount() }}
                  </span>
                }
              </div>
              {{ 'header.tracking' | translate }}
            </a>
          }

          <a routerLink="/history" (click)="mobileMenuOpen.set(false)"
             class="mobile-sheet-item">
            <svg class="h-5 w-5" style="color: var(--primary-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
            </svg>
            {{ 'header.history' | translate }}
          </a>

          @if (auth.hasRole(['admin'])) {
            <a routerLink="/settings" (click)="mobileMenuOpen.set(false)"
               class="mobile-sheet-item">
              <svg class="h-5 w-5" style="color: var(--muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ 'settings.title' | translate }}
            </a>
          }

          <div class="my-1 mx-2 border-t" style="border-color: color-mix(in srgb, var(--border) 50%, transparent)"></div>

          <button (click)="theme.toggle(); mobileMenuOpen.set(false)"
                  class="mobile-sheet-item w-full">
            @if (theme.isDark()) {
              <svg class="h-5 w-5" style="color: var(--orange)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
            } @else {
              <svg class="h-5 w-5" style="color: var(--purple)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            }
            {{ 'header.theme' | translate }}
          </button>

          @if (auth.user()) {
            <div class="my-1 mx-2 border-t" style="border-color: color-mix(in srgb, var(--border) 50%, transparent)"></div>
            <button (click)="onLogout()"
                    class="mobile-sheet-item w-full" style="color: var(--magenta)">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
              </svg>
              {{ 'common.logout' | translate }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    /* ─── Glass pill (shared base) ─── */
    .glass-pill {
      border-radius: 9999px;
      background: color-mix(in srgb, var(--surface-card) 72%, transparent);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
      box-shadow:
        0 4px 24px -4px rgba(0,0,0,0.08),
        0 1px 2px rgba(0,0,0,0.04),
        inset 0 1px 0 color-mix(in srgb, white 8%, transparent);
    }
    :host-context(.dark) .glass-pill {
      background: color-mix(in srgb, var(--surface-card) 65%, transparent);
      box-shadow:
        0 4px 32px -4px rgba(0,0,0,0.35),
        0 1px 2px rgba(0,0,0,0.2),
        inset 0 1px 0 rgba(255,255,255,0.06);
    }

    /* ─── Glass dropdown ─── */
    .glass-dropdown {
      border-radius: 1rem;
      background: color-mix(in srgb, var(--surface-card) 82%, transparent);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
      box-shadow:
        0 8px 40px -8px rgba(0,0,0,0.12),
        0 2px 6px rgba(0,0,0,0.06),
        inset 0 1px 0 color-mix(in srgb, white 10%, transparent);
    }
    :host-context(.dark) .glass-dropdown {
      background: color-mix(in srgb, var(--surface-card) 75%, transparent);
      box-shadow:
        0 8px 40px -8px rgba(0,0,0,0.5),
        0 2px 6px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.05);
    }

    /* ─── Desktop pill nav link ─── */
    .pill-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--muted);
      transition: all 0.2s ease;
      white-space: nowrap;
      position: relative;
    }
    .pill-link:hover {
      color: var(--on-surface);
      background: color-mix(in srgb, var(--on-surface) 6%, transparent);
    }
    .pill-link.pill-active {
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      font-weight: 600;
    }
    .pill-label {
      display: none;
    }
    @media (min-width: 1200px) {
      .pill-label { display: inline; }
    }

    /* ─── Desktop pill button (theme/lang) ─── */
    .pill-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 2rem;
      width: 2rem;
      border-radius: 9999px;
      color: var(--muted);
      transition: all 0.2s ease;
    }
    .pill-btn:hover {
      color: var(--on-surface);
      background: color-mix(in srgb, var(--on-surface) 6%, transparent);
    }

    /* ─── Mobile pill nav link ─── */
    .pill-mob-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      padding: 0.5rem 0.75rem;
      border-radius: 9999px;
      color: var(--muted);
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .pill-mob-link.pill-mob-active {
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, transparent);
    }
    .pill-mob-label {
      font-size: 0.625rem;
      font-weight: 600;
      line-height: 1;
    }

    /* ─── Mobile sheet item ─── */
    .mobile-sheet-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--on-surface);
      transition: background-color 0.15s ease;
    }
    .mobile-sheet-item:hover {
      background: color-mix(in srgb, var(--on-surface) 5%, transparent);
    }

    /* ─── Context select (compact inline select for header) ─── */
    .context-select {
      appearance: none;
      -webkit-appearance: none;
      background: color-mix(in srgb, var(--on-surface) 5%, transparent);
      border: none;
      border-radius: 9999px;
      padding: 0.25rem 1.25rem 0.25rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--on-surface);
      cursor: pointer;
      max-width: 9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.15s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.25rem center;
      background-size: 0.875rem;
    }
    .context-select:hover {
      background-color: color-mix(in srgb, var(--on-surface) 10%, transparent);
    }
    .context-select:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }

    .blocker-badge {
      animation: blockerPulse 2s ease-in-out infinite;
    }
    @keyframes blockerPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
      50% { box-shadow: 0 0 0 4px rgba(255, 152, 0, 0); }
    }
  `],
})
export class HeaderComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  backlogTracker = inject(BacklogReadTrackerService);
  activityStore = inject(ActivityStoreService);
  appContext = inject(AppContextService);
  teamStore = inject(TeamStore);
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);

  canSwitchTeams(): boolean {
    return this.auth.hasRole(['admin', 'functional']);
  }

  onTeamChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.appContext.switchTeam(value);
  }

  onLogout(): void {
    this.userMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    void this.auth.logout();
  }
}
