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
    <section class="rounded-xl border p-6" style="background:var(--surface);border-color:var(--border)">
      <div class="mb-4 flex items-center gap-2">
        <svg class="h-5 w-5" style="color:var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
        </svg>
        <h2 class="text-lg font-semibold" style="color:var(--on-surface)">{{ 'dashboard.metrics' | translate }}</h2>
      </div>
      <div class="flex max-w-md flex-col gap-4 sm:flex-row sm:items-center">
        <div class="h-52 w-52 shrink-0">
          <canvas baseChart
            [data]="chartData()"
            [options]="chartOptions()"
            [type]="'doughnut'"
          ></canvas>
        </div>
        <div class="space-y-2 text-sm">
          <p><span class="font-medium text-incidencia dark:text-red-400">{{ 'types.incidencia' | translate }}:</span> <span style="color:var(--on-surface)">{{ metrics().incidencia | number:'1.1-1' }}%</span></p>
          <p><span class="font-medium text-mejora dark:text-blue-400">{{ 'types.mejora' | translate }}:</span> <span style="color:var(--on-surface)">{{ metrics().mejora | number:'1.1-1' }}%</span></p>
          <p><span class="font-medium text-proyecto dark:text-green-400">{{ 'types.proyecto' | translate }}:</span> <span style="color:var(--on-surface)">{{ metrics().proyecto | number:'1.1-1' }}%</span></p>
          <p class="pt-2" style="color:var(--muted)">{{ 'dashboard.total' | translate }}: {{ metrics().total }} {{ 'dashboard.requests' | translate }}</p>
        </div>
      </div>
    </section>
  `,
})
export class MetricsComponent {
  private dashboard = inject(DashboardService);
  private theme = inject(ThemeService);

  metrics = this.dashboard.metricsDistribution;

  chartData = computed(() => {
    const m = this.dashboard.metricsDistribution();
    return {
      labels: ['Incidencias', 'Mejoras', 'Proyectos'],
      datasets: [
        {
          data: [m.incidencia, m.mejora, m.proyecto],
          backgroundColor: ['#dc2626', '#2563eb', '#16a34a'],
          hoverBackgroundColor: ['#b91c1c', '#1d4ed8', '#15803d'],
          borderWidth: 0,
        },
      ],
    };
  });

  chartOptions = computed((): ChartConfiguration<'doughnut'>['options'] => {
    const dark = this.theme.isDark();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: dark ? '#94a3b8' : '#64748b',
          },
        },
      },
    };
  });
}
