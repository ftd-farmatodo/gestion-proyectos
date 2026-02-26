import { Injectable, inject, signal, computed } from '@angular/core';
import type { Request } from '../../shared/models/request.model';
import { ActivityLoggerService } from './activity-logger.service';
import { AuthService } from '../auth/auth.service';
import { AppContextService } from './app-context.service';
import { FiscalYearService } from './fiscal-year.service';
import { SequenceService } from './sequence.service';
import { TeamStore } from './team-store.service';
import { SupabaseService } from './supabase.service';

/**
 * Global store for requests. Single source of truth for all features.
 * When Supabase is connected, this will sync from real-time channel.
 */
@Injectable({ providedIn: 'root' })
export class RequestStoreService {
  private activityLogger = inject(ActivityLoggerService);
  private auth = inject(AuthService);
  private appContext = inject(AppContextService);
  private fyService = inject(FiscalYearService);
  private sequenceService = inject(SequenceService);
  private teamStore = inject(TeamStore);
  private supabase = inject(SupabaseService);
  private _requests = signal<Request[]>([]);
  private channelName = `requests-sync-${Math.random().toString(36).slice(2, 8)}`;
  private _reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.reload();
    this.setupRealtime();
  }

  /** All requests (unfiltered) */
  readonly requests = this._requests.asReadonly();

  /**
   * Requests filtered by the current app context (active team + fiscal year).
   * This is the primary data source for all feature components.
   */
  readonly contextRequests = computed(() => {
    const teamId = this.appContext.activeTeamId();
    const fy = this.appContext.activeFiscalYear();
    return this._requests().filter(
      (r) => r.team_id === teamId && r.fiscal_year === fy
    );
  });

  setRequests(requests: Request[]): void {
    this._requests.set(requests);
  }

  updateRequest(id: string, patch: Partial<Request>): void {
    const changingPriority =
      patch.urgency !== undefined || patch.importance !== undefined || patch.complexity !== undefined;
    if (changingPriority && !this.auth.hasRole(['developer', 'admin'])) {
      return;
    }

    const list = this._requests();
    const existing = list.find((r) => r.id === id);
    if (existing) {
      this.detectAndLogChanges(existing, patch);
    }
    this._requests.update((l) =>
      l.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    void this.persistUpdate(id, patch);
  }

  addRequest(request: Request): Request {
    const user = this.auth.user();
    const teamId = request.team_id || user?.team_id || this.appContext.activeTeamId();
    const team = this.teamStore.getById(teamId);
    const teamCode = team?.code ?? 'GP';

    const stamped: Request = {
      ...request,
      id: request.id || crypto.randomUUID(),
      team_id: teamId,
      fiscal_year: request.fiscal_year || this.fyService.currentFiscalYear().key,
      internal_id: request.internal_id || this.sequenceService.next(teamCode),
    };

    this._requests.update((list) => [stamped, ...list]);
    this.activityLogger.log({
      request_id: stamped.id,
      request_title: stamped.title,
      request_internal_id: stamped.internal_id,
      team_id: stamped.team_id,
      fiscal_year: stamped.fiscal_year,
      type: 'request_created',
      description: `Solicitud "${stamped.title}" creada`,
      metadata: stamped.priority_inference
        ? { priority_inference: stamped.priority_inference }
        : undefined,
    });
    void this.persistInsert(stamped);
    return stamped;
  }

  private detectAndLogChanges(existing: Request, patch: Partial<Request>): void {
    const base = {
      request_id: existing.id,
      request_internal_id: existing.internal_id,
      request_title: existing.title,
      team_id: existing.team_id,
      fiscal_year: existing.fiscal_year,
    };

    if (patch.status !== undefined && patch.status !== existing.status) {
      this.activityLogger.log({
        ...base,
        type: 'status_change',
        description: `Estado cambiado de "${existing.status}" a "${patch.status}"`,
        metadata: { old_status: existing.status, new_status: patch.status },
      });
    }

    if (patch.developer_id !== undefined && patch.developer_id !== existing.developer_id) {
      this.activityLogger.log({
        ...base,
        type: 'assignment_change',
        description: `Desarrollador asignado cambiado`,
        metadata: { old_developer: existing.developer_id, new_developer: patch.developer_id },
      });
    }

    if (
      (patch.urgency !== undefined && patch.urgency !== existing.urgency) ||
      (patch.importance !== undefined && patch.importance !== existing.importance)
    ) {
      this.activityLogger.log({
        ...base,
        type: 'priority_change',
        description: `Prioridad actualizada`,
        metadata: {
          old_urgency: existing.urgency,
          new_urgency: patch.urgency ?? existing.urgency,
          old_importance: existing.importance,
          new_importance: patch.importance ?? existing.importance,
        },
      });
    }
  }

  /** Seed sequence counters from existing mock data so new IDs continue from the right number */
  private seedSequenceCounters(): void {
    const teams = this.teamStore.all();
    for (const team of teams) {
      if (!team.code) continue;
      const teamRequests = this._requests().filter((r) => r.team_id === team.id && r.internal_id);
      if (teamRequests.length > 0) {
        const maxNum = Math.max(
          ...teamRequests.map((r) => {
            const parts = r.internal_id.split('-');
            return parseInt(parts[parts.length - 1], 10) || 0;
          })
        );
        this.sequenceService.seed(team.code, maxNum);
      }
    }
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('RequestStoreService.reload() failed:', err);
      return;
    }
    const { data, error } = await client
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('RequestStoreService.reload() failed:', error);
      return;
    }
    if (!data) return;
    const mapped = data.map((row) => this.fromRow(row));
    this._requests.set(mapped);
    this.seedSequenceCounters();
  }

  private setupRealtime(): void {
    const channel = this.supabase.channel(this.channelName);
    if (!channel) return;
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          if (this._reloadTimer) clearTimeout(this._reloadTimer);
          this._reloadTimer = setTimeout(() => void this.reload(), 300);
        }
      )
      .subscribe();
  }

  private async persistInsert(request: Request): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._requests.update((list) => list.filter((r) => r.id !== request.id));
      return;
    }
    const { error } = await client.from('requests').insert(this.toRow(request));
    if (error) {
      this._requests.update((list) => list.filter((r) => r.id !== request.id));
    }
  }

  private async persistUpdate(id: string, patch: Partial<Request>): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return;
    }
    const { error } = await client.from('requests').update(this.toRowPatch(patch)).eq('id', id);
    if (error) {
      await this.reload();
    }
  }

  private fromRow(row: Record<string, unknown>): Request {
    const comments = Array.isArray(row['comments']) ? (row['comments'] as Request['comments']) : [];
    const attachments = Array.isArray(row['attachments']) ? (row['attachments'] as Request['attachments']) : [];
    const countries = Array.isArray(row['countries']) ? (row['countries'] as string[]) : [];
    return {
      id: String(row['id']),
      internal_id: String(row['internal_id'] ?? ''),
      title: String(row['title'] ?? ''),
      description: String(row['description'] ?? ''),
      type: row['type'] as Request['type'],
      status: String(row['status'] ?? 'backlog'),
      requester_id: String(row['requester_id'] ?? ''),
      requester_name: String(row['requester_name'] ?? ''),
      requester_department: String(row['requester_department'] ?? ''),
      developer_id: (row['developer_id'] as string | null) ?? null,
      urgency: Number(row['urgency'] ?? 1),
      importance: Number(row['importance'] ?? 1),
      complexity: Number(row['complexity'] ?? 1),
      priorityScore: Number(row['priority_score'] ?? row['priorityScore'] ?? 0),
      comments,
      created_at: String(row['created_at'] ?? new Date().toISOString()),
      updated_at: String(row['updated_at'] ?? new Date().toISOString()),
      team_id: String(row['team_id'] ?? ''),
      fiscal_year: String(row['fiscal_year'] ?? ''),
      affected_module: (row['affected_module'] as string | undefined) ?? undefined,
      steps_to_reproduce: (row['steps_to_reproduce'] as string | undefined) ?? undefined,
      expected_behavior: (row['expected_behavior'] as string | undefined) ?? undefined,
      actual_behavior: (row['actual_behavior'] as string | undefined) ?? undefined,
      affected_url: (row['affected_url'] as string | undefined) ?? undefined,
      business_justification: (row['business_justification'] as string | undefined) ?? undefined,
      expected_benefit: (row['expected_benefit'] as string | undefined) ?? undefined,
      impacted_users: (row['impacted_users'] as string | undefined) ?? undefined,
      attachments,
      countries,
    };
  }

  private toRow(request: Request): Record<string, unknown> {
    return {
      id: request.id,
      internal_id: request.internal_id,
      title: request.title,
      description: request.description,
      type: request.type,
      status: request.status,
      requester_id: request.requester_id,
      requester_name: request.requester_name,
      requester_department: request.requester_department,
      developer_id: request.developer_id,
      urgency: request.urgency,
      importance: request.importance,
      complexity: request.complexity,
      priority_score: request.priorityScore,
      comments: request.comments ?? [],
      created_at: request.created_at,
      updated_at: request.updated_at,
      team_id: request.team_id,
      fiscal_year: request.fiscal_year,
      affected_module: request.affected_module ?? null,
      steps_to_reproduce: request.steps_to_reproduce ?? null,
      expected_behavior: request.expected_behavior ?? null,
      actual_behavior: request.actual_behavior ?? null,
      affected_url: request.affected_url ?? null,
      business_justification: request.business_justification ?? null,
      expected_benefit: request.expected_benefit ?? null,
      impacted_users: request.impacted_users ?? null,
      attachments: request.attachments ?? [],
      countries: request.countries ?? [],
    };
  }

  private toRowPatch(patch: Partial<Request>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row['title'] = patch.title;
    if (patch.description !== undefined) row['description'] = patch.description;
    if (patch.type !== undefined) row['type'] = patch.type;
    if (patch.status !== undefined) row['status'] = patch.status;
    if (patch.requester_name !== undefined) row['requester_name'] = patch.requester_name;
    if (patch.requester_department !== undefined) row['requester_department'] = patch.requester_department;
    if (patch.developer_id !== undefined) row['developer_id'] = patch.developer_id;
    if (patch.urgency !== undefined) row['urgency'] = patch.urgency;
    if (patch.importance !== undefined) row['importance'] = patch.importance;
    if (patch.complexity !== undefined) row['complexity'] = patch.complexity;
    if (patch.priorityScore !== undefined) row['priority_score'] = patch.priorityScore;
    if (patch.comments !== undefined) row['comments'] = patch.comments;
    if (patch.updated_at !== undefined) row['updated_at'] = patch.updated_at;
    if (patch.team_id !== undefined) row['team_id'] = patch.team_id;
    if (patch.fiscal_year !== undefined) row['fiscal_year'] = patch.fiscal_year;
    if (patch.affected_module !== undefined) row['affected_module'] = patch.affected_module;
    if (patch.steps_to_reproduce !== undefined) row['steps_to_reproduce'] = patch.steps_to_reproduce;
    if (patch.expected_behavior !== undefined) row['expected_behavior'] = patch.expected_behavior;
    if (patch.actual_behavior !== undefined) row['actual_behavior'] = patch.actual_behavior;
    if (patch.affected_url !== undefined) row['affected_url'] = patch.affected_url;
    if (patch.business_justification !== undefined) row['business_justification'] = patch.business_justification;
    if (patch.expected_benefit !== undefined) row['expected_benefit'] = patch.expected_benefit;
    if (patch.impacted_users !== undefined) row['impacted_users'] = patch.impacted_users;
    if (patch.attachments !== undefined) row['attachments'] = patch.attachments;
    if (patch.countries !== undefined) row['countries'] = patch.countries;
    return row;
  }
}
