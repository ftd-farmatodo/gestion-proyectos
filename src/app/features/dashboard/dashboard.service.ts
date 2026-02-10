import { Injectable, computed } from '@angular/core';
import type { Request } from '../../shared/models/request.model';
import { MOCK_USERS } from '../../data/mock-data';
import { RequestStoreService } from '../../core/services/request-store.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private store: RequestStoreService) {}

  get requests() {
    return this.store.requests;
  }

  /** Developers with their current in_progress task */
  readonly teamFocus = computed(() => {
    const devs = MOCK_USERS.filter((u) => u.role === 'developer' || u.role === 'admin');
    const reqs = this.store.requests().filter((r) => r.status === 'in_progress');
    return devs.map((dev) => ({
      developer: dev,
      currentRequest: reqs.find((r) => r.developer_id === dev.id) ?? null,
    }));
  });

  /** Top 5 by priority score (excluding done) */
  readonly priorityQueue = computed(() =>
    [...this.store.requests()]
      .filter((r) => r.status !== 'done')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
  );

  /** Distribution counts for metrics chart */
  readonly metricsDistribution = computed(() => {
    const list = this.store.requests();
    const incidencia = list.filter((r) => r.type === 'incidencia').length;
    const mejora = list.filter((r) => r.type === 'mejora').length;
    const proyecto = list.filter((r) => r.type === 'proyecto').length;
    const total = list.length;
    return {
      incidencia: total ? (incidencia / total) * 100 : 0,
      mejora: total ? (mejora / total) * 100 : 0,
      proyecto: total ? (proyecto / total) * 100 : 0,
      total,
    };
  });

}
