import { Injectable, signal, computed } from '@angular/core';
import type { Request, CreateRequestPayload } from '../../shared/models/request.model';
import { COMPLEXITY_WEIGHTS } from '../../shared/models/request.model';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RequestStoreService } from '../../core/services/request-store.service';

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  readonly loading = signal<boolean>(false);

  readonly myRequests = computed(() => {
    const user = this.auth.user();
    if (!user) return [];
    return this.store.requests().filter((r) => r.requester_id === user.id);
  });

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private store: RequestStoreService
  ) {}

  addRequest(payload: CreateRequestPayload): void {
    this.loading.set(true);
    try {
      const user = this.auth.user();
      if (!user) {
        this.toast.error('Debes iniciar sesión para crear una solicitud.');
        return;
      }
      const score =
        ((payload.urgency + payload.importance) / 2) *
        (COMPLEXITY_WEIGHTS[payload.complexity] ?? 0.7);
      const now = new Date().toISOString();
      const newRequest: Request = {
        id: `req-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: 'backlog',
        requester_id: user.id,
        developer_id: null,
        urgency: payload.urgency,
        importance: payload.importance,
        complexity: payload.complexity,
        priorityScore: Math.round(score * 100) / 100,
        created_at: now,
        updated_at: now,
      };
      this.store.addRequest(newRequest);
      this.toast.success('Solicitud creada correctamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
