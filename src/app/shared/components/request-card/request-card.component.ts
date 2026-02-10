import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Request } from '../../models/request.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PriorityScoreComponent } from '../priority-score/priority-score.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent, PriorityScoreComponent, TranslatePipe],
  template: `
    <div
      class="group rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style="background:var(--surface);border-color:var(--border)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="mb-1 flex items-center gap-2">
            <span class="inline-block h-2.5 w-2.5 rounded-full shrink-0" [class]="dotClass()"></span>
            <span class="text-xs font-medium uppercase tracking-wider" [class]="typeTextClass()" style="color:var(--muted)">
              {{ ('types.' + request().type) | translate }}
            </span>
          </div>
          <h3 class="text-sm font-semibold leading-snug" style="color:var(--on-surface)">{{ request().title }}</h3>
          <p class="mt-1 line-clamp-2 text-xs leading-relaxed" style="color:var(--muted)">{{ request().description }}</p>
        </div>
        <app-priority-score [score]="request().priorityScore" />
      </div>
      <div class="mt-3 flex items-center gap-2">
        <app-status-badge [status]="request().status" />
        <span class="ml-auto text-xs tabular-nums" style="color:var(--muted)">
          {{ request().created_at | date:'shortDate' }}
        </span>
      </div>
    </div>
  `,
})
export class RequestCardComponent {
  request = input.required<Request>();

  dotClass(): string {
    const t = this.request().type;
    if (t === 'incidencia') return 'bg-incidencia';
    if (t === 'mejora') return 'bg-mejora';
    return 'bg-proyecto';
  }

  typeTextClass(): string {
    const t = this.request().type;
    if (t === 'incidencia') return 'text-incidencia dark:text-red-400';
    if (t === 'mejora') return 'text-mejora dark:text-blue-400';
    return 'text-proyecto dark:text-green-400';
  }
}
