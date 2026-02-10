import { Component, inject } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { RequestCardComponent } from '../../../shared/components/request-card/request-card.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-priority-queue',
  standalone: true,
  imports: [RequestCardComponent, TranslatePipe],
  template: `
    <section class="rounded-xl border p-6" style="background:var(--surface);border-color:var(--border)">
      <div class="mb-4 flex items-center gap-2">
        <svg class="h-5 w-5" style="color:var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
        </svg>
        <h2 class="text-lg font-semibold" style="color:var(--on-surface)">{{ 'dashboard.priorityQueue' | translate }}</h2>
      </div>
      <div class="space-y-3">
        @for (req of dashboard.priorityQueue(); track req.id) {
          <app-request-card [request]="req" />
        }
      </div>
    </section>
  `,
})
export class PriorityQueueComponent {
  dashboard = inject(DashboardService);
}
