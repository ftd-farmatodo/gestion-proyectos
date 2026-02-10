import { Component } from '@angular/core';
import { TeamFocusComponent } from '../team-focus/team-focus.component';
import { PriorityQueueComponent } from '../priority-queue/priority-queue.component';
import { MetricsComponent } from '../metrics/metrics.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [TeamFocusComponent, PriorityQueueComponent, MetricsComponent, TranslatePipe],
  template: `
    <div class="space-y-6 p-4 lg:p-6">
      <h1 class="text-2xl font-bold tracking-tight" style="color:var(--on-surface)">
        {{ 'dashboard.title' | translate }}
      </h1>
      <div class="grid gap-6 lg:grid-cols-2">
        <app-team-focus />
        <app-metrics />
      </div>
      <app-priority-queue />
    </div>
  `,
})
export class DashboardLayoutComponent {}
