import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardService } from '../dashboard.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [NgChartsModule, DecimalPipe, TranslatePipe],
  template: `
    <section class="dash-card overflow-hidden h-full">
      <!-- Header -->
      <div class="flex items-center gap-2.5 px-5 py-4 border-b" style="border-color: var(--border)">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl"
             style="background: color-mix(in srgb, var(--purple) 12%, transparent)">
          <svg class="h-4 w-4" style="color: var(--purple)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
          </svg>
        </div>
        <h2 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'dashboard.metrics' | translate }}</h2>
      </div>

      <div class="p-5">
        <!-- Chart row: doughnut + legend -->
        <div class="flex items-center gap-5">
          <!-- Doughnut with center label -->
          <div class="relative h-36 w-36 shrink-0">
            <canvas baseChart
              [data]="chartData()"
              [options]="chartOptions()"
              [type]="'doughnut'"
            ></canvas>
            <!-- Center label -->
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold tabular-nums" style="color: var(--on-surface)">{{ metrics().total }}</span>
              <span class="text-[10px] font-medium uppercase tracking-wider" style="color: var(--muted)">{{ 'dashboard.total' | translate }}</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 space-y-2.5">
            <div class="flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 rounded-sm shrink-0" style="background: var(--magenta)"></span>
              <span class="flex-1 text-xs font-medium" style="color: var(--on-surface)">{{ 'types.incidencia' | translate }}</span>
              <span class="text-xs font-bold tabular-nums" style="color: var(--muted)">{{ metrics().incidencia | number:'1.0-0' }}%</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 rounded-sm shrink-0" style="background: var(--primary-light)"></span>
              <span class="flex-1 text-xs font-medium" style="color: var(--on-surface)">{{ 'types.mejora' | translate }}</span>
              <span class="text-xs font-bold tabular-nums" style="color: var(--muted)">{{ metrics().mejora | number:'1.0-0' }}%</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 rounded-sm shrink-0" style="background: var(--lime)"></span>
              <span class="flex-1 text-xs font-medium" style="color: var(--on-surface)">{{ 'types.proyecto' | translate }}</span>
              <span class="text-xs font-bold tabular-nums" style="color: var(--muted)">{{ metrics().proyecto | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>

        <!-- Status breakdown bar -->
        @if (statusBreakdown().length > 0) {
          <div class="mt-5 pt-4 border-t" style="border-color: var(--border)">
            <p class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
              {{ 'dashboard.statusBreakdown' | translate }}
            </p>

            <!-- Stacked bar -->
            <div class="flex h-3 w-full overflow-hidden rounded-full" style="background: color-mix(in srgb, var(--on-surface) 5%, transparent)">
              @for (seg of statusBreakdown(); track seg.key) {
                <div class="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                     [style.width.%]="seg.percentage"
                     [style.background]="seg.color">
                </div>
              }
            </div>

            <!-- Labels -->
            <div class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              @for (seg of statusBreakdown(); track seg.key) {
                <div class="flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full shrink-0" [style.background]="seg.color"></span>
                  <span class="text-[10px] font-medium" style="color: var(--muted)">{{ seg.label }}</span>
                  <span class="text-[10px] font-bold tabular-nums" style="color: var(--on-surface)">{{ seg.count }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class MetricsComponent {
  private dashboard = inject(DashboardService);
  private theme = inject(ThemeService);

  metrics = this.dashboard.metricsDistribution;
  statusBreakdown = this.dashboard.statusBreakdown;

  chartData = computed(() => {
    const m = this.dashboard.metricsDistribution();
    const dark = this.theme.isDark();
    return {
      labels: ['Incidencias', 'Mejoras', 'Proyectos'],
      datasets: [
        {
          data: [m.incidencia, m.mejora, m.proyecto],
          backgroundColor: dark
            ? ['#E85DA8', '#6AADFF', '#A8D95E']
            : ['#CC2D7F', '#0077C8', '#8DC63F'],
          hoverBackgroundColor: dark
            ? ['#CC2D7F', '#0077C8', '#8DC63F']
            : ['#A8256A', '#005FA0', '#72A032'],
          borderWidth: 0,
        },
      ],
    };
  });

  chartOptions = computed((): ChartConfiguration<'doughnut'>['options'] => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 11 },
          cornerRadius: 8,
          padding: 8,
        },
      },
    };
  });
}
