import { Component, input, output } from '@angular/core';
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
      class="min-h-[200px] rounded-2xl border-2 border-dashed p-4 transition-all duration-200"
      [style.border-color]="borderColor()"
      [style.background]="bgColor()"
    >
      <h3 class="mb-3 text-xs font-bold uppercase tracking-wider" [style.color]="titleColor()">
        {{ title() }}
      </h3>
      <div class="space-y-2">
        @for (req of requests(); track req.id) {
          <div cdkDrag [cdkDragData]="req" class="cursor-grab active:cursor-grabbing">
            <app-request-card [request]="req" (openDetail)="openDetail.emit($event)" />
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
  openDetail = output<Request>();

  quadrantId = () => this.quadrantKey();

  borderColor(): string {
    const q = this.quadrantKey();
    if (q === 'q1') return 'color-mix(in srgb, var(--magenta) 40%, transparent)';
    if (q === 'q2') return 'color-mix(in srgb, var(--purple) 40%, transparent)';
    if (q === 'q3') return 'color-mix(in srgb, var(--orange) 40%, transparent)';
    return 'color-mix(in srgb, var(--cool-gray) 40%, transparent)';
  }

  bgColor(): string {
    const q = this.quadrantKey();
    if (q === 'q1') return 'color-mix(in srgb, var(--magenta) 4%, var(--surface-card))';
    if (q === 'q2') return 'color-mix(in srgb, var(--purple) 4%, var(--surface-card))';
    if (q === 'q3') return 'color-mix(in srgb, var(--orange) 4%, var(--surface-card))';
    return 'color-mix(in srgb, var(--cool-gray) 4%, var(--surface-card))';
  }

  titleColor(): string {
    const q = this.quadrantKey();
    if (q === 'q1') return 'var(--magenta)';
    if (q === 'q2') return 'var(--purple)';
    if (q === 'q3') return 'var(--orange)';
    return 'var(--cool-gray)';
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
