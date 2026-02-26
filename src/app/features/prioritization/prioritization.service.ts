import { Injectable, signal, computed } from '@angular/core';
import type { Request, QuadrantKey, Comment } from '../../shared/models/request.model';
import { calculatePriorityScore } from '../../shared/models/request.model';
import { ToastService } from '../../core/services/toast.service';
import { RequestStoreService } from '../../core/services/request-store.service';
import { AuthService } from '../../core/auth/auth.service';
import { ActivityLoggerService } from '../../core/services/activity-logger.service';
import { I18nService } from '../../core/services/i18n.service';

/** Returns which quadrant a request belongs to based on urgency and impact level */
export function getQuadrantForRequest(r: Request): QuadrantKey {
  const u = r.urgency >= 3;
  const i = r.importance >= 3; // importance >= 3 → high/medium impact
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
    private store: RequestStoreService,
    private auth: AuthService,
    private activityLogger: ActivityLoggerService,
    private i18n: I18nService
  ) {}

  private static readonly EXCLUDED_STATUSES = new Set(['backlog', 'cancelled']);

  /** Requests eligible for the matrix (excludes backlog and cancelled) */
  private readonly actionableRequests = computed(() =>
    this.store.contextRequests().filter((r) => !PrioritizationService.EXCLUDED_STATUSES.has(r.status))
  );

  get requests() {
    return this.store.contextRequests;
  }

  readonly q1 = computed(() =>
    this.actionableRequests().filter((r) => r.urgency >= 3 && r.importance >= 3)
  );
  readonly q2 = computed(() =>
    this.actionableRequests().filter((r) => r.urgency < 3 && r.importance >= 3)
  );
  readonly q3 = computed(() =>
    this.actionableRequests().filter((r) => r.urgency >= 3 && r.importance < 3)
  );
  readonly q4 = computed(() =>
    this.actionableRequests().filter((r) => r.urgency < 3 && r.importance < 3)
  );

  readonly quadrants = computed(() => ({
    q1: this.q1(),
    q2: this.q2(),
    q3: this.q3(),
    q4: this.q4(),
  }));

  moveToQuadrant(requestId: string, quadrant: QuadrantKey): void {
    const { urgency, importance } = QUADRANT_VALUES[quadrant];
    const list = this.store.contextRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return;
    const priorityScore = calculatePriorityScore(urgency, importance, req.complexity);
    this.store.updateRequest(requestId, {
      urgency,
      importance,
      priorityScore,
      updated_at: new Date().toISOString(),
    });
    this.toast.info(this.i18n.t('common.priorityUpdated'));
  }

  addComment(requestId: string, text: string): void {
    const list = this.store.contextRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return;
    const user = this.auth.user();
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author_id: user?.id ?? 'anonymous',
      text,
      created_at: new Date().toISOString(),
    };
    const updatedComments = [...(req.comments ?? []), newComment];
    this.store.updateRequest(requestId, {
      comments: updatedComments,
      updated_at: new Date().toISOString(),
    });

    this.activityLogger.log({
      request_id: requestId,
      request_internal_id: req.internal_id,
      request_title: req.title,
      team_id: req.team_id,
      fiscal_year: req.fiscal_year,
      type: 'comment_added',
      description: `Comentario agregado: "${text.length > 60 ? text.substring(0, 60) + '…' : text}"`,
    });

    this.toast.success('Comentario agregado.');
  }
}
