import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeamFocusComponent } from '../team-focus/team-focus.component';
import { MetricsComponent } from '../metrics/metrics.component';
import { PriorityQueueComponent } from '../priority-queue/priority-queue.component';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { RecognitionSpotlightComponent } from '../recognition-spotlight/recognition-spotlight.component';
import { KpiStripComponent } from '../kpi-strip/kpi-strip.component';
import { ObjectivesProgressComponent } from '../objectives-progress/objectives-progress.component';
import { AppContextService } from '../../../core/services/app-context.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    TeamFocusComponent,
    MetricsComponent,
    PriorityQueueComponent,
    RecentActivityComponent,
    RecognitionSpotlightComponent,
    KpiStripComponent,
    ObjectivesProgressComponent,
    RouterLink,
    TranslatePipe,
  ],
  template: `
    <div class="p-4 lg:p-6">
      <!-- Greeting header -->
      <div class="mb-6 animate-scale-in stagger-1">
        @if (appContext.isReadOnly()) {
          <div class="mb-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
               style="background: color-mix(in srgb, var(--orange) 12%, transparent); color: var(--orange)">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            @if (!appContext.isViewingOwnTeam()) {
              {{ appContext.activeTeamName() }}
            }
            &mdash; {{ 'header.readOnly' | translate }}
          </div>
        }
        <h1 class="text-2xl font-bold tracking-tight lg:text-3xl" style="color: var(--on-surface)">
          {{ greeting() }},
        </h1>
        <p class="mt-1 text-sm" style="color: var(--muted)">
          {{ 'dashboard.subtitle' | translate }} &middot; {{ formattedDate() }}
        </p>
        <div class="mt-3 flex items-center gap-2">
          <a
            routerLink="/submissions/new"
            class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md"
            style="background: var(--accent)">
            {{ 'submissions.new' | translate }}
          </a>
          <a
            routerLink="/submissions/list"
            class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style="border-color: var(--border); color: var(--muted)">
            {{ 'submissions.title' | translate }}
          </a>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="mb-6 animate-scale-in stagger-2">
        <app-kpi-strip />
      </div>

      <!-- Recognition Spotlight -->
      <div class="mb-6 animate-scale-in stagger-3">
        <app-recognition-spotlight />
      </div>

      <!-- Objectives Progress -->
      <div class="mb-6 animate-scale-in stagger-4">
        <app-objectives-progress />
      </div>

      <!-- Two-column: Team Pulse + Metrics -->
      <div class="mb-6 grid gap-5 lg:grid-cols-2">
        <div class="animate-scale-in stagger-4">
          <app-team-focus />
        </div>
        <div class="animate-scale-in stagger-5">
          <app-metrics />
        </div>
      </div>

      <!-- Priority Runway -->
      <div class="mb-6 animate-scale-in stagger-6">
        <app-priority-queue />
      </div>

      <!-- Activity Stream -->
      <div class="animate-scale-in stagger-7">
        <app-recent-activity />
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent {
  readonly appContext = inject(AppContextService);
  private i18n = inject(I18nService);

  /** Time-of-day contextual greeting */
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return this.i18n.t('dashboard.greetingMorning');
    if (hour < 18) return this.i18n.t('dashboard.greetingAfternoon');
    return this.i18n.t('dashboard.greetingEvening');
  });

  /** Current date formatted nicely */
  readonly formattedDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
}
