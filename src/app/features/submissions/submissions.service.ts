import { Injectable, signal, computed } from '@angular/core';
import type { Request, CreateRequestPayload } from '../../shared/models/request.model';
import { calculatePriorityScore } from '../../shared/models/request.model';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RequestStoreService } from '../../core/services/request-store.service';
import { I18nService } from '../../core/services/i18n.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  readonly loading = signal<boolean>(false);

  readonly myRequests = computed(() => {
    const user = this.auth.user();
    if (!user) return [];
    if (user.role === 'functional') {
      return this.store.contextRequests().filter((r) => r.team_id === user.team_id);
    }
    return this.store.contextRequests().filter((r) => r.requester_id === user.id);
  });

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private store: RequestStoreService,
    private i18n: I18nService,
    private storage: StorageService,
  ) {}

  async addRequest(payload: CreateRequestPayload): Promise<Request | null> {
    this.loading.set(true);
    try {
      const user = this.auth.user();
      if (!user) {
        this.toast.error(this.i18n.t('common.loginRequired'));
        return null;
      }
      const score = calculatePriorityScore(payload.urgency, payload.importance, payload.complexity);
      const now = new Date().toISOString();
      const requestId = crypto.randomUUID();
      const uploadedAttachments = await this.storage.uploadRequestAttachments(
        payload.attachments,
        requestId,
        user.id
      );
      const newRequest: Request = {
        id: requestId,
        internal_id: '', // auto-stamped by RequestStoreService.addRequest
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: 'backlog',
        requester_id: user.id,
        requester_name: user.display_name ?? user.email,
        requester_department: user.department ?? '',
        developer_id: null,
        urgency: payload.urgency,
        importance: payload.importance,
        complexity: payload.complexity,
        priorityScore: score,
        comments: [],
        created_at: now,
        updated_at: now,
        team_id: '', // auto-stamped by RequestStoreService.addRequest
        fiscal_year: '', // auto-stamped by RequestStoreService.addRequest
        // Extended fields
        affected_module: payload.affected_module,
        steps_to_reproduce: payload.steps_to_reproduce,
        expected_behavior: payload.expected_behavior,
        actual_behavior: payload.actual_behavior,
        affected_url: payload.affected_url,
        business_justification: payload.business_justification,
        expected_benefit: payload.expected_benefit,
        impacted_users: payload.impacted_users,
        attachments: uploadedAttachments,
        countries: payload.countries ?? [],
        priority_inference: payload.priority_inference,
      };
      const created = this.store.addRequest(newRequest);
      this.toast.success(this.i18n.t('common.requestCreated'));
      return created;
    } finally {
      this.loading.set(false);
    }
  }
}
