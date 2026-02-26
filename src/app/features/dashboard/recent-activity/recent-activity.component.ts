import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ActivityStoreService } from '../../../core/services/activity-store.service';
import { I18nService } from '../../../core/services/i18n.service';

interface GroupedActivities {
  label: string;
  entries: ReturnType<ActivityStoreService['recent']>;
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="dash-card overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b" style="border-color: var(--border)">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl"
               style="background: color-mix(in srgb, var(--accent) 12%, transparent)">
            <svg class="h-4 w-4" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-sm font-semibold" style="color: var(--on-surface)">
            {{ 'tracking.recentActivity' | translate }}
          </h2>
        </div>
        <a routerLink="/tracking"
           class="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
           style="color: var(--primary-light); background: color-mix(in srgb, var(--primary-light) 8%, transparent)"
           >
          {{ 'tracking.viewAll' | translate }}
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </a>
      </div>

      <div class="px-5 py-4">
        @for (group of groupedEntries(); track group.label) {
          <!-- Time group label -->
          <div class="mb-3 flex items-center gap-2" [class.mt-4]="!$first">
            <span class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--muted)">
              {{ group.label }}
            </span>
            <div class="flex-1 h-px" style="background: var(--border)"></div>
          </div>

          <!-- Timeline entries -->
          <div class="relative ml-3">
            <!-- Vertical timeline line -->
            <div class="absolute left-[5px] top-2 bottom-2 w-px" style="background: var(--border)"></div>

            @for (entry of group.entries; track entry.id) {
              <div class="group relative flex items-start gap-3.5 pb-4 last:pb-0">
                <!-- Timeline dot -->
                <div class="relative z-10 mt-1 flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full ring-2"
                     [style.background]="activityColor(entry.type)"
                     style="ring-color: var(--surface-card)">
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 -mt-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold" style="color: var(--on-surface)">{{ entry.actor_name }}</span>
                    <span class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                          [style.background]="badgeBg(entry.type)"
                          [style.color]="activityColor(entry.type)">
                      {{ ('activity.' + entry.type) | translate }}
                    </span>
                    <span class="text-[10px] tabular-nums" style="color: var(--cool-gray)">{{ relativeTime(entry.created_at) }}</span>
                  </div>
                  <p class="mt-0.5 text-[11px] leading-relaxed truncate" style="color: var(--muted)">
                    {{ entry.description }}
                  </p>
                  <span class="text-[10px] font-medium" style="color: var(--primary-light)">{{ entry.request_title }}</span>
                </div>
              </div>
            }
          </div>
        } @empty {
          <div class="py-8 text-center">
            <p class="text-sm italic" style="color: var(--muted)">{{ 'tracking.noActivity' | translate }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class RecentActivityComponent {
  private activityStore = inject(ActivityStoreService);
  private i18n = inject(I18nService);

  /** Group recent entries by time period */
  groupedEntries = computed<GroupedActivities[]>(() => {
    const entries = this.activityStore.recent(6);
    if (!entries.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const groups: Map<string, typeof entries> = new Map();
    const order: string[] = [];

    for (const entry of entries) {
      const entryDate = new Date(entry.created_at);
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

      let label: string;
      if (entryDay.getTime() >= today.getTime()) {
        label = this.i18n.t('tracking.today');
      } else if (entryDay.getTime() >= yesterday.getTime()) {
        label = this.i18n.t('tracking.yesterday');
      } else {
        label = this.i18n.t('tracking.thisWeek');
      }

      if (!groups.has(label)) {
        groups.set(label, []);
        order.push(label);
      }
      groups.get(label)!.push(entry);
    }

    return order.map((label) => ({ label, entries: groups.get(label)! }));
  });

  relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return this.i18n.t('tracking.now');
    if (diffMin < 60) return this.i18n.t('tracking.minutesAgo').replace('{n}', String(diffMin));
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return this.i18n.t('tracking.hoursAgo').replace('{n}', String(diffH));
    const diffD = Math.floor(diffH / 24);
    return this.i18n.t('tracking.daysAgo').replace('{n}', String(diffD));
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
}
