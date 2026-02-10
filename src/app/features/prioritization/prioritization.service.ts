import { Injectable, signal, computed } from '@angular/core';
import type { Request, QuadrantKey } from '../../shared/models/request.model';
import { COMPLEXITY_WEIGHTS } from '../../shared/models/request.model';
import { ToastService } from '../../core/services/toast.service';
import { RequestStoreService } from '../../core/services/request-store.service';

/** Returns which quadrant a request belongs to based on urgency/importance */
export function getQuadrantForRequest(r: Request): QuadrantKey {
  const u = r.urgency >= 3;
  const i = r.importance >= 3;
  if (u && i) return 'q1';
  if (!u && i) return 'q2';
  if (u && !i) return 'q3';
  return 'q4';
}

/** Urgency/importance values to assign when dropping in a quadrant */
const QUADRANT_VALUES: Record<QuadrantKey, { urgency: number; importance: number }> = {
  q1: { urgency: 4, importance: 4 },
  q2: { urgency: 2, importance: 4 },
  q3: { urgency: 4, importance: 2 },
  q4: { urgency: 2, importance: 2 },
};

@Injectable({ providedIn: 'root' })
export class PrioritizationService {
  readonly loading = signal<boolean>(false);

  constructor(
    private toast: ToastService,
    private store: RequestStoreService
  ) {}

  get requests() {
    return this.store.requests;
  }

  readonly q1 = computed(() =>
    this.store.requests().filter((r) => r.urgency >= 3 && r.importance >= 3)
  );
  readonly q2 = computed(() =>
    this.store.requests().filter((r) => r.urgency < 3 && r.importance >= 3)
  );
  readonly q3 = computed(() =>
    this.store.requests().filter((r) => r.urgency >= 3 && r.importance < 3)
  );
  readonly q4 = computed(() =>
    this.store.requests().filter((r) => r.urgency < 3 && r.importance < 3)
  );

  readonly quadrants = computed(() => ({
    q1: this.q1(),
    q2: this.q2(),
    q3: this.q3(),
    q4: this.q4(),
  }));

  moveToQuadrant(requestId: string, quadrant: QuadrantKey): void {
    const { urgency, importance } = QUADRANT_VALUES[quadrant];
    const list = this.store.requests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return;
    const weight = COMPLEXITY_WEIGHTS[req.complexity] ?? 0.7;
    const priorityScore =
      Math.round(((urgency + importance) / 2) * weight * 100) / 100;
    this.store.updateRequest(requestId, {
      urgency,
      importance,
      priorityScore,
      updated_at: new Date().toISOString(),
    });
    this.toast.info('Prioridad actualizada.');
  }
}
