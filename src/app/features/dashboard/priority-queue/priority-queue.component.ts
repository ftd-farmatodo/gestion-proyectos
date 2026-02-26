import { Component, inject, computed } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PriorityScoreComponent } from '../../../shared/components/priority-score/priority-score.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import type { Request } from '../../../shared/models/request.model';
import { getImpactLevel } from '../../../shared/models/request.model';

@Component({
  selector: 'app-priority-queue',
  standalone: true,
  imports: [TranslatePipe, PriorityScoreComponent, StatusBadgeComponent],
  template: `
    <section class="dash-card overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-2.5 px-5 py-4 border-b" style="border-color: var(--border)">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl"
             style="background: color-mix(in srgb, var(--accent) 12%, transparent)">
          <svg class="h-4 w-4" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
          </svg>
        </div>
        <h2 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'dashboard.priorityQueue' | translate }}</h2>
      </div>

      <!-- Ranked items -->
      <div class="p-4">
        @if (topItems().length === 0 && restItems().length === 0) {
          <div class="py-8 text-center">
            <p class="text-sm" style="color: var(--muted)">{{ 'common.empty' | translate }}</p>
          </div>
        }
        <!-- Top 3: podium-style cards -->
        @if (topItems().length > 0) {
          <div class="grid gap-3 sm:grid-cols-3 mb-3">
            @for (item of topItems(); track item.req.id; let i = $index) {
              <div class="group relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                   [style.background]="'color-mix(in srgb, ' + typeColor(item.req.type) + ' 4%, var(--surface-card))'"
                   style="border: 1px solid var(--border)">

                <!-- Rank badge -->
                <div class="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                     [style.background]="rankBg(i)"
                     [style.color]="rankColor(i)">
                  {{ i + 1 }}
                </div>

                <!-- Type dot + label -->
                <div class="mb-2 flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full" [style.background]="typeColor(item.req.type)"></span>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" [style.color]="typeColor(item.req.type)">
                    {{ item.req.type }}
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-sm font-semibold leading-snug line-clamp-2 pr-8" style="color: var(--on-surface)">
                  <span class="font-mono text-[10px] mr-1" style="color: var(--primary-light)">{{ item.req.internal_id }}</span>
                  {{ item.req.title }}
                </h3>

                <!-- Bottom: score + status -->
                <div class="mt-3 flex items-center justify-between">
                  <app-priority-score [score]="item.req.priorityScore" />
                  <app-status-badge [status]="item.req.status" />
                </div>
              </div>
            }
          </div>
        }

        <!-- Remaining items: compact list -->
        @if (restItems().length > 0) {
          <div class="space-y-2">
            @for (item of restItems(); track item.req.id; let i = $index) {
              <div class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                   style="border: 1px solid var(--border)">
                <!-- Rank -->
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style="background: color-mix(in srgb, var(--on-surface) 5%, transparent); color: var(--muted)">
                  {{ item.rank }}
                </span>
                <!-- Type dot -->
                <span class="h-2 w-2 shrink-0 rounded-full" [style.background]="typeColor(item.req.type)"></span>
                <!-- Title -->
                <span class="flex-1 truncate text-xs font-medium" style="color: var(--on-surface)">
                  <span class="font-mono text-[10px] mr-1" style="color: var(--primary-light)">{{ item.req.internal_id }}</span>{{ item.req.title }}
                </span>
                <!-- Score -->
                <app-priority-score [score]="item.req.priorityScore" />
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class PriorityQueueComponent {
  private dashboard = inject(DashboardService);

  private rankedItems = computed(() =>
    this.dashboard.priorityQueue().map((req, i) => ({ req, rank: i + 1 }))
  );

  topItems = computed(() => this.rankedItems().slice(0, 3));
  restItems = computed(() => this.rankedItems().slice(3));

  typeColor(type: string): string {
    if (type === 'incidencia') return 'var(--magenta)';
    if (type === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  rankBg(index: number): string {
    if (index === 0) return 'color-mix(in srgb, var(--accent) 15%, transparent)';
    if (index === 1) return 'color-mix(in srgb, var(--primary-light) 12%, transparent)';
    return 'color-mix(in srgb, var(--orange) 10%, transparent)';
  }

  rankColor(index: number): string {
    if (index === 0) return 'var(--accent)';
    if (index === 1) return 'var(--primary-light)';
    return 'var(--orange)';
  }
}
