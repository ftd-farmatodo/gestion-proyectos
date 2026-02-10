import { Component, input } from '@angular/core';
import type { RequestStatus } from '../../models/request.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="badgeClass()">
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClass()"></span>
      {{ ('status.' + status()) | translate }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<RequestStatus>();

  badgeClass(): string {
    switch (this.status()) {
      case 'backlog':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'prioritized':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'done':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  }

  dotClass(): string {
    switch (this.status()) {
      case 'backlog':
        return 'bg-slate-400 dark:bg-slate-500';
      case 'prioritized':
        return 'bg-amber-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'done':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  }
}
