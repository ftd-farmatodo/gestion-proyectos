import { Component } from '@angular/core';
import { PrioritizationService } from '../prioritization.service';
import { QuadrantComponent } from '../quadrant/quadrant.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

const QUADRANT_IDS = ['q1', 'q2', 'q3', 'q4'] as const;

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [QuadrantComponent, TranslatePipe],
  template: `
    <div class="space-y-6 p-4 lg:p-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color:var(--on-surface)">{{ 'matrix.title' | translate }}</h1>
        <p class="mt-1 text-sm" style="color:var(--muted)">
          {{ 'matrix.description' | translate }}
          <span class="ml-2 text-xs italic">{{ 'matrix.axisHint' | translate }}</span>
        </p>
      </div>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <app-quadrant
          quadrantKey="q1"
          [title]="'matrix.q1' | translate"
          [requests]="prioritization.q1()"
          [connectedTo]="quadrantIds"
        />
        <app-quadrant
          quadrantKey="q2"
          [title]="'matrix.q2' | translate"
          [requests]="prioritization.q2()"
          [connectedTo]="quadrantIds"
        />
        <app-quadrant
          quadrantKey="q3"
          [title]="'matrix.q3' | translate"
          [requests]="prioritization.q3()"
          [connectedTo]="quadrantIds"
        />
        <app-quadrant
          quadrantKey="q4"
          [title]="'matrix.q4' | translate"
          [requests]="prioritization.q4()"
          [connectedTo]="quadrantIds"
        />
      </div>
    </div>
  `,
})
export class MatrixComponent {
  quadrantIds = QUADRANT_IDS as unknown as string[];

  constructor(public prioritization: PrioritizationService) {}
}
