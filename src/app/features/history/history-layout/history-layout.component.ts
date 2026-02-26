import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FiscalYearCloseService } from '../../../core/services/fiscal-year-close.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { FyDetailDialogComponent } from '../fy-detail-dialog/fy-detail-dialog.component';
import type { FiscalYearCloseRecord } from '../../../shared/models/fiscal-year.model';

@Component({
  selector: 'app-history-layout',
  standalone: true,
  imports: [DatePipe, TranslatePipe, FyDetailDialogComponent],
  template: `
    <div class="space-y-6 p-4 lg:p-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--on-surface)">
          {{ 'history.title' | translate }}
        </h1>
        <p class="mt-1 text-sm" style="color: var(--muted)">
          {{ 'history.subtitle' | translate }}
        </p>
        @if (closedYears().length > 0) {
          <button
            (click)="exportCsv()"
            class="mt-3 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style="border-color: var(--border); color: var(--accent)">
            {{ 'history.exportCsv' | translate }}
          </button>
        }
      </div>

      <!-- Closed fiscal years -->
      @if (closedYears().length > 0) {
        <div class="space-y-4">
          @for (record of closedYears(); track record.fyKey) {
            <div class="dash-card overflow-hidden transition-all hover:shadow-lg">
              <!-- Card header -->
              <div class="flex items-center justify-between border-b px-5 py-4" style="border-color: var(--border)">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                       style="background: color-mix(in srgb, var(--accent) 12%, transparent)">
                    <svg class="h-5 w-5" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-base font-bold" style="color: var(--on-surface)">
                      {{ record.summary.teamName }} &mdash; {{ record.label }}
                    </h2>
                    <p class="text-[11px]" style="color: var(--muted)">
                      {{ 'history.closedOn' | translate }} {{ record.closedAt | date:'mediumDate' }}
                    </p>
                  </div>
                </div>
                <button (click)="openDetail(record)"
                        class="rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:shadow-md"
                        style="background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent)">
                  {{ 'history.viewDetails' | translate }}
                </button>
              </div>

              <!-- KPI strip -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                <div class="rounded-xl p-3 text-center" style="background: var(--surface-alt)">
                  <div class="text-xl font-bold tabular-nums" style="color: var(--on-surface)">{{ record.summary.totalRequests }}</div>
                  <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'history.totalRequests' | translate }}</div>
                </div>
                <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--lime) 8%, transparent)">
                  <div class="text-xl font-bold tabular-nums" style="color: var(--lime)">{{ record.summary.completed }}</div>
                  <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--lime)">{{ 'history.completed' | translate }}</div>
                </div>
                <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--orange) 8%, transparent)">
                  <div class="text-xl font-bold tabular-nums" style="color: var(--orange)">{{ record.summary.carriedOver }}</div>
                  <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--orange)">{{ 'history.carriedOver' | translate }}</div>
                </div>
                <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--accent) 8%, transparent)">
                  <div class="text-xl font-bold tabular-nums" style="color: var(--accent)">{{ record.summary.avgPriorityScore }}</div>
                  <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--accent)">{{ 'history.avgScore' | translate }}</div>
                </div>
              </div>

              <!-- Type distribution bar -->
              <div class="px-5 pb-3">
                <div class="flex h-2.5 overflow-hidden rounded-full">
                  @if (record.summary.byType.incidencia > 0) {
                    <div class="transition-all" [style.width.%]="typePercent(record, 'incidencia')" style="background: var(--magenta)"></div>
                  }
                  @if (record.summary.byType.mejora > 0) {
                    <div class="transition-all" [style.width.%]="typePercent(record, 'mejora')" style="background: var(--primary-light)"></div>
                  }
                  @if (record.summary.byType.proyecto > 0) {
                    <div class="transition-all" [style.width.%]="typePercent(record, 'proyecto')" style="background: var(--lime)"></div>
                  }
                </div>
                <div class="mt-2 flex flex-wrap gap-3 text-[10px] font-semibold">
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full" style="background: var(--magenta)"></span>
                    {{ 'types.incidencia' | translate }} ({{ record.summary.byType.incidencia }})
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full" style="background: var(--primary-light)"></span>
                    {{ 'types.mejora' | translate }} ({{ record.summary.byType.mejora }})
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full" style="background: var(--lime)"></span>
                    {{ 'types.proyecto' | translate }} ({{ record.summary.byType.proyecto }})
                  </span>
                </div>
              </div>

              <!-- Top achievements -->
              @if (record.summary.topAchievements.length > 0) {
                <div class="border-t px-5 py-4" style="border-color: var(--border)">
                  <h3 class="text-xs font-semibold mb-2.5" style="color: var(--muted)">
                    {{ 'history.topAchievements' | translate }}
                  </h3>
                  <div class="space-y-1.5">
                    @for (achievement of record.summary.topAchievements.slice(0, 3); track achievement.internal_id) {
                      <div class="flex items-center gap-3 rounded-lg px-3 py-2" style="background: var(--surface-alt)">
                        <span class="font-mono text-[10px] font-bold" style="color: var(--primary-light)">{{ achievement.internal_id }}</span>
                        <span class="flex-1 truncate text-xs font-medium" style="color: var(--on-surface)">{{ achievement.title }}</span>
                        <span class="text-[10px]" style="color: var(--muted)">{{ achievement.developer }}</span>
                        <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                              style="background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent)">
                          {{ achievement.score }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Empty state -->
        <div class="rounded-2xl border p-12 text-center" style="background: var(--surface-card); border-color: var(--border)">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
               style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
            <svg class="h-7 w-7" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-sm font-medium" style="color: var(--on-surface)">{{ 'history.empty' | translate }}</p>
          <p class="mt-1 text-xs" style="color: var(--muted)">{{ 'history.emptyHint' | translate }}</p>
        </div>
      }
    </div>

    <!-- Detail dialog -->
    @if (activeRecord(); as record) {
      <app-fy-detail-dialog
        [record]="record"
        (closeDialog)="activeRecord.set(null)"
      />
    }
  `,
})
export class HistoryLayoutComponent {
  private fyCloseService = inject(FiscalYearCloseService);
  private appContext = inject(AppContextService);

  activeRecord = signal<FiscalYearCloseRecord | null>(null);

  /** Closed fiscal years for the active team, most recent first */
  closedYears = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return [...this.fyCloseService.closedYearsForTeam(teamId)]
      .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  });

  openDetail(record: FiscalYearCloseRecord): void {
    this.activeRecord.set(record);
  }

  typePercent(record: FiscalYearCloseRecord, type: 'incidencia' | 'mejora' | 'proyecto'): number {
    const total = record.summary.totalRequests;
    if (total === 0) return 0;
    return (record.summary.byType[type] / total) * 100;
  }

  exportCsv(): void {
    const rows = [
      [
        'fy_key',
        'label',
        'team',
        'closed_at',
        'total_requests',
        'completed',
        'carried_over',
        'avg_priority_score',
      ],
      ...this.closedYears().map((r) => [
        r.fyKey,
        r.label,
        r.summary.teamName,
        r.closedAt,
        String(r.summary.totalRequests),
        String(r.summary.completed),
        String(r.summary.carriedOver),
        String(r.summary.avgPriorityScore),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${this.appContext.activeTeamId()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
