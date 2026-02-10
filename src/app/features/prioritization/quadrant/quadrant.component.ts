import { Component, input } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import type { Request, QuadrantKey } from '../../../shared/models/request.model';
import { RequestCardComponent } from '../../../shared/components/request-card/request-card.component';
import { PrioritizationService } from '../prioritization.service';

@Component({
  selector: 'app-quadrant',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, RequestCardComponent],
  template: `
    <div
      cdkDropList
      [id]="quadrantId()"
      [cdkDropListData]="requests()"
      [cdkDropListConnectedTo]="connectedTo()"
      (cdkDropListDropped)="onDrop($event)"
      class="min-h-[200px] rounded-xl border-2 border-dashed p-4 transition-colors"
      [class]="dropZoneClass()"
    >
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide" [class]="titleClass()">
        {{ title() }}
      </h3>
      <div class="space-y-2">
        @for (req of requests(); track req.id) {
          <div cdkDrag [cdkDragData]="req" class="cursor-grab active:cursor-grabbing">
            <app-request-card [request]="req" />
            <div *cdkDragPlaceholder class="opacity-50">
              <app-request-card [request]="req" />
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class QuadrantComponent {
  quadrantKey = input.required<QuadrantKey>();
  title = input.required<string>();
  requests = input.required<Request[]>();
  connectedTo = input<string[]>([]);

  quadrantId = () => this.quadrantKey();

  dropZoneClass(): string {
    const q = this.quadrantKey();
    if (q === 'q1') return 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20';
    if (q === 'q2') return 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20';
    if (q === 'q3') return 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20';
    return 'border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/20';
  }

  titleClass(): string {
    const q = this.quadrantKey();
    if (q === 'q1') return 'text-red-700 dark:text-red-400';
    if (q === 'q2') return 'text-amber-700 dark:text-amber-400';
    if (q === 'q3') return 'text-blue-700 dark:text-blue-400';
    return 'text-slate-600 dark:text-slate-400';
  }

  constructor(private prioritization: PrioritizationService) {}

  onDrop(event: { item: { data: Request }; container: { id: string } }): void {
    const request = event.item.data;
    const targetQuadrant = event.container.id as QuadrantKey;
    if (request && targetQuadrant) {
      this.prioritization.moveToQuadrant(request.id, targetQuadrant);
    }
  }
}
