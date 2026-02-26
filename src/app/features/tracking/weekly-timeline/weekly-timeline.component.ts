import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TrackingService, type ActiveBlocker } from '../tracking.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import type { ActivityEntry } from '../../../shared/models/request.model';

@Component({
  selector: 'app-weekly-timeline',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="space-y-6 p-4 lg:p-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight" style="color: var(--on-surface)">
            {{ 'tracking.title' | translate }}
          </h1>
          <p class="mt-1 text-sm" style="color: var(--muted)">
            {{ 'tracking.subtitle' | translate }}
          </p>
        </div>

        <!-- Week navigation -->
        <div class="flex items-center gap-2">
          <button (click)="tracking.previousWeek()"
            class="rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style="color: var(--on-surface)"
            [attr.aria-label]="'tracking.prevWeek' | translate">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <button (click)="tracking.goToCurrentWeek()"
            class="rounded-xl border px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style="border-color: var(--border); color: var(--on-surface)">
            {{ tracking.weekLabel() }}
          </button>
          <button (click)="tracking.nextWeek()"
            class="rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style="color: var(--on-surface)"
            [disabled]="tracking.weekOffset() >= 0"
            [attr.aria-label]="'tracking.nextWeek' | translate">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              [class.opacity-30]="tracking.weekOffset() >= 0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="flex flex-wrap items-center gap-3">
        <label class="text-xs font-semibold uppercase tracking-wider" style="color: var(--muted)">
          {{ 'tracking.filterBy' | translate }}
        </label>
        <select
          [ngModel]="tracking.selectedDeveloper()"
          (ngModelChange)="tracking.selectedDeveloper.set($event)"
          class="gp-select">
          <option [ngValue]="null">{{ 'tracking.allMembers' | translate }}</option>
          @for (dev of tracking.developers(); track dev.id) {
            <option [ngValue]="dev.id">{{ dev.display_name ?? dev.email }}</option>
          }
        </select>
      </div>

      <!-- Active Blockers Panel -->
      @if (tracking.activeBlockers().length > 0) {
        <div class="rounded-2xl border overflow-hidden" style="border-color: color-mix(in srgb, var(--magenta) 40%, var(--border)); background: color-mix(in srgb, var(--magenta) 3%, var(--surface-card))">
          <div class="flex items-center justify-between px-5 py-3 border-b"
            style="background: color-mix(in srgb, var(--magenta) 8%, var(--surface-alt)); border-color: color-mix(in srgb, var(--magenta) 20%, var(--border))">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
                style="background: color-mix(in srgb, var(--magenta) 15%, transparent); color: var(--magenta)">⚠</span>
              <h2 class="text-sm font-bold" style="color: var(--magenta)">
                {{ 'tracking.activeBlockersTitle' | translate }}
              </h2>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style="background: var(--magenta); color: white">
                {{ tracking.activeBlockers().length }}
              </span>
            </div>
          </div>

          <div class="divide-y" style="--tw-divide-opacity: 1; border-color: color-mix(in srgb, var(--magenta) 10%, var(--border))">
            @for (blocker of tracking.activeBlockers(); track blocker.blockerEntry.id) {
              <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <a class="text-sm font-bold hover:underline cursor-pointer truncate"
                      style="color: var(--on-surface)"
                      [routerLink]="['/prioritization']"
                      [queryParams]="{ requestId: blocker.requestId }">
                      <span class="font-mono text-xs mr-1.5" style="color: var(--primary-light)">{{ blocker.requestInternalId }}</span>
                      {{ blocker.requestTitle }}
                    </a>
                  </div>
                  <p class="text-xs leading-relaxed" style="color: var(--muted)">
                    {{ blocker.description }}
                  </p>
                  <div class="flex items-center gap-3 flex-wrap text-[10px]" style="color: var(--muted)">
                    @if (blocker.developerName) {
                      <span class="inline-flex items-center gap-1">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                        </svg>
                        {{ blocker.developerName }}
                      </span>
                    }
                    <span class="inline-flex items-center gap-1">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Reportado por {{ blocker.reportedBy }}
                    </span>
                    <span class="inline-flex items-center gap-1 font-semibold" style="color: var(--magenta)">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ blocker.durationText }}
                    </span>
                  </div>
                </div>
                @if (canResolveBlockers()) {
                  <button (click)="onResolveBlocker(blocker)"
                    class="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    style="background: color-mix(in srgb, var(--lime) 15%, transparent); color: var(--lime)">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ 'tracking.resolveBlocker' | translate }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }

      <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <!-- Main timeline -->
        <div class="space-y-4">
          @for (day of tracking.dailySummaries(); track day.date) {
            <div class="rounded-2xl border overflow-hidden" style="background: var(--surface-card); border-color: var(--border)">
              <!-- Day header -->
              <div class="flex items-center justify-between px-5 py-3 border-b"
                style="background: var(--surface-alt); border-color: var(--border)">
                <h2 class="text-sm font-bold" style="color: var(--on-surface)">{{ day.label }}</h2>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                  style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
                  {{ day.entries.length }} {{ day.entries.length === 1 ? ('tracking.eventSingular' | translate) : ('tracking.eventPlural' | translate) }}
                </span>
              </div>

              @if (day.entries.length > 0) {
                <div class="relative ml-7 border-l-2 py-3" style="border-color: var(--border)">
                  @for (entry of day.entries; track entry.id) {
                    <div class="relative pl-5 pb-3 last:pb-0">
                      <!-- Dot -->
                      <div class="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2"
                        [style.border-color]="activityColor(entry.type)"
                        [style.background]="dotBg(entry.type)">
                      </div>
                      <!-- Content -->
                      <div class="pr-5">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                            [style.background]="badgeBg(entry.type)"
                            [style.color]="activityColor(entry.type)">
                            {{ activityIcon(entry.type) }} {{ ('activity.' + entry.type) | translate }}
                          </span>
                          <span class="text-[10px] font-medium" style="color: var(--muted)">
                            {{ entry.actor_name }}
                          </span>
                          <span class="text-[10px]" style="color: var(--muted)">
                            {{ entry.created_at | date:'shortTime' }}
                          </span>
                        </div>
                        <p class="mt-0.5 text-xs leading-relaxed" style="color: var(--on-surface)">
                          {{ entry.description }}
                        </p>
                        <a
                          class="mt-0.5 inline-block text-[10px] font-medium hover:underline cursor-pointer"
                          style="color: var(--primary-light)"
                          [routerLink]="['/prioritization']"
                          [queryParams]="{ requestId: entry.request_id }">
                          {{ entry.request_title }}
                        </a>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="px-5 py-6 text-center">
                  <p class="text-sm italic" style="color: var(--muted)">{{ 'tracking.noActivity' | translate }}</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Side panel: Weekly Summary (desktop only) -->
        <div class="hidden lg:block space-y-4">
          <div class="rounded-2xl border p-5 space-y-4 sticky top-6"
            style="background: var(--surface-card); border-color: var(--border)">
            <h3 class="text-sm font-bold" style="color: var(--on-surface)">
              {{ 'tracking.weekSummary' | translate }}
            </h3>

            <div class="space-y-3">
              <!-- Requests touched -->
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color: var(--muted)">{{ 'tracking.requestsTouched' | translate }}</span>
                <span class="text-lg font-bold tabular-nums" style="color: var(--on-surface)">
                  {{ tracking.weekStats().requestsTouched }}
                </span>
              </div>

              <!-- Progress updates -->
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color: var(--muted)">{{ 'tracking.progressUpdates' | translate }}</span>
                <span class="text-lg font-bold tabular-nums" style="color: var(--accent)">
                  {{ tracking.weekStats().progressUpdates }}
                </span>
              </div>

              <!-- Active blockers -->
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color: var(--muted)">{{ 'tracking.activeBlockers' | translate }}</span>
                <span class="text-lg font-bold tabular-nums"
                  [style.color]="tracking.weekStats().activeBlockers > 0 ? 'var(--magenta)' : 'var(--on-surface)'">
                  {{ tracking.weekStats().activeBlockers }}
                </span>
              </div>

              <!-- Completed -->
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color: var(--muted)">{{ 'tracking.completed' | translate }}</span>
                <span class="text-lg font-bold tabular-nums" style="color: var(--lime)">
                  {{ tracking.weekStats().completedRequests }}
                </span>
              </div>

              <!-- Total entries -->
              <div class="pt-3 mt-3 border-t flex items-center justify-between" style="border-color: var(--border)">
                <span class="text-xs font-semibold" style="color: var(--muted)">{{ 'tracking.totalEvents' | translate }}</span>
                <span class="text-lg font-bold tabular-nums" style="color: var(--on-surface)">
                  {{ tracking.weekStats().totalEntries }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile summary cards -->
      <div class="grid grid-cols-2 gap-3 lg:hidden">
        <div class="rounded-2xl p-4 text-center" style="background: var(--surface-card); border: 1px solid var(--border)">
          <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'tracking.requestsTouched' | translate }}</div>
          <div class="mt-1 text-2xl font-bold" style="color: var(--on-surface)">{{ tracking.weekStats().requestsTouched }}</div>
        </div>
        <div class="rounded-2xl p-4 text-center" style="background: var(--surface-card); border: 1px solid var(--border)">
          <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'tracking.activeBlockers' | translate }}</div>
          <div class="mt-1 text-2xl font-bold" [style.color]="tracking.weekStats().activeBlockers > 0 ? 'var(--magenta)' : 'var(--on-surface)'">
            {{ tracking.weekStats().activeBlockers }}
          </div>
        </div>
        <div class="rounded-2xl p-4 text-center" style="background: var(--surface-card); border: 1px solid var(--border)">
          <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'tracking.progressUpdates' | translate }}</div>
          <div class="mt-1 text-2xl font-bold" style="color: var(--accent)">{{ tracking.weekStats().progressUpdates }}</div>
        </div>
        <div class="rounded-2xl p-4 text-center" style="background: var(--surface-card); border: 1px solid var(--border)">
          <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'tracking.completed' | translate }}</div>
          <div class="mt-1 text-2xl font-bold" style="color: var(--lime)">{{ tracking.weekStats().completedRequests }}</div>
        </div>
      </div>
    </div>
  `,
})
export class WeeklyTimelineComponent {
  tracking = inject(TrackingService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  canResolveBlockers(): boolean {
    return this.auth.hasRole(['developer', 'admin']);
  }

  async onResolveBlocker(blocker: ActiveBlocker): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Resolver bloqueo',
      message: `¿Resolver el bloqueo de "${blocker.requestInternalId} – ${blocker.requestTitle}"?`,
      confirmText: 'Resolver',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.tracking.resolveBlocker(blocker);
  }

  activityColor(type: string): string {
    switch (type) {
      case 'request_created': return 'var(--primary-light)';
      case 'status_change': return 'var(--purple)';
      case 'assignment_change': return 'var(--primary)';
      case 'priority_change': return 'var(--orange)';
      case 'comment_added': return 'var(--accent)';
      case 'progress_update': return 'var(--accent)';
      case 'blocker_reported': return 'var(--magenta)';
      case 'blocker_resolved': return 'var(--lime)';
      default: return 'var(--muted)';
    }
  }

  badgeBg(type: string): string {
    return `color-mix(in srgb, ${this.activityColor(type)} 10%, transparent)`;
  }

  dotBg(type: string): string {
    if (type === 'blocker_reported') return 'var(--magenta)';
    if (type === 'blocker_resolved') return 'var(--lime)';
    return 'var(--surface-card)';
  }

  activityIcon(type: string): string {
    switch (type) {
      case 'request_created': return '✦';
      case 'status_change': return '↔';
      case 'assignment_change': return '👤';
      case 'priority_change': return '⬆';
      case 'comment_added': return '💬';
      case 'progress_update': return '▶';
      case 'blocker_reported': return '⚠';
      case 'blocker_resolved': return '✓';
      default: return '•';
    }
  }
}
