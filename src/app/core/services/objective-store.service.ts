import { Injectable, inject, signal, computed } from '@angular/core';
import type { Objective, RequestAssignee } from '../../shared/models/request.model';
import { SupabaseService } from './supabase.service';
import { AppContextService } from './app-context.service';
import { FiscalYearService } from './fiscal-year.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ObjectiveStoreService {
  private supabase = inject(SupabaseService);
  private appContext = inject(AppContextService);
  private fyService = inject(FiscalYearService);
  private auth = inject(AuthService);

  private _objectives = signal<Objective[]>([]);
  private _requestObjectives = signal<{ request_id: string; objective_id: string }[]>([]);
  private _requestAssignees = signal<RequestAssignee[]>([]);

  constructor() {
    void this.reload();
  }

  readonly objectives = this._objectives.asReadonly();

  readonly activeObjectives = computed(() => {
    const teamId = this.appContext.activeTeamId();
    const year = this.currentYear();
    return this._objectives().filter(
      (o) => o.team_id === teamId && o.year === year && o.is_active
    );
  });

  readonly allTeamObjectives = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return this._objectives().filter((o) => o.team_id === teamId);
  });

  readonly requestObjectives = this._requestObjectives.asReadonly();
  readonly requestAssignees = this._requestAssignees.asReadonly();

  getObjectivesByRequestId(requestId: string): Objective[] {
    const ids = this._requestObjectives()
      .filter((ro) => ro.request_id === requestId)
      .map((ro) => ro.objective_id);
    return this._objectives().filter((o) => ids.includes(o.id));
  }

  getAssigneesByRequestId(requestId: string): RequestAssignee[] {
    return this._requestAssignees().filter((ra) => ra.request_id === requestId);
  }

  getRequestIdsByObjective(objectiveId: string): string[] {
    return this._requestObjectives()
      .filter((ro) => ro.objective_id === objectiveId)
      .map((ro) => ro.request_id);
  }

  private currentYear(): number {
    const fyKey = this.fyService.currentFiscalYear().key;
    const match = fyKey.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : new Date().getFullYear();
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return;
    }

    const [objRes, roRes, raRes] = await Promise.all([
      client.from('objectives').select('*').order('year', { ascending: false }),
      client.from('request_objectives').select('*'),
      client.from('request_assignees').select('*'),
    ]);

    if (objRes.data) {
      this._objectives.set(objRes.data.map((row) => this.mapObjective(row)));
    }
    if (roRes.data) {
      this._requestObjectives.set(
        roRes.data.map((row) => ({
          request_id: String(row['request_id']),
          objective_id: String(row['objective_id']),
        }))
      );
    }
    if (raRes.data) {
      this._requestAssignees.set(
        raRes.data.map((row) => ({
          request_id: String(row['request_id']),
          developer_id: String(row['developer_id']),
          assigned_at: String(row['assigned_at']),
          assigned_by: (row['assigned_by'] as string | null) ?? null,
        }))
      );
    }
  }

  async createObjective(obj: Omit<Objective, 'id' | 'created_at' | 'updated_at'>): Promise<Objective | null> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return null;
    }
    const { data, error } = await client
      .from('objectives')
      .insert({
        team_id: obj.team_id,
        year: obj.year,
        code: obj.code,
        title: obj.title,
        description: obj.description ?? null,
        is_active: obj.is_active,
      })
      .select()
      .single();
    if (error || !data) return null;
    const mapped = this.mapObjective(data);
    this._objectives.update((list) => [mapped, ...list]);
    return mapped;
  }

  async updateObjective(id: string, patch: Partial<Objective>): Promise<boolean> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return false;
    }
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row['title'] = patch.title;
    if (patch.description !== undefined) row['description'] = patch.description;
    if (patch.code !== undefined) row['code'] = patch.code;
    if (patch.is_active !== undefined) row['is_active'] = patch.is_active;

    const { error } = await client.from('objectives').update(row).eq('id', id);
    if (error) return false;
    this._objectives.update((list) =>
      list.map((o) => (o.id === id ? { ...o, ...patch, updated_at: new Date().toISOString() } : o))
    );
    return true;
  }

  async deleteObjective(id: string): Promise<boolean> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return false;
    }
    const { error } = await client.from('objectives').delete().eq('id', id);
    if (error) return false;
    this._objectives.update((list) => list.filter((o) => o.id !== id));
    this._requestObjectives.update((list) => list.filter((ro) => ro.objective_id !== id));
    return true;
  }

  async setRequestObjectives(requestId: string, objectiveIds: string[]): Promise<boolean> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return false;
    }
    const { error: delErr } = await client
      .from('request_objectives')
      .delete()
      .eq('request_id', requestId);
    if (delErr) return false;

    if (objectiveIds.length > 0) {
      const rows = objectiveIds.map((oid) => ({ request_id: requestId, objective_id: oid }));
      const { error: insErr } = await client.from('request_objectives').insert(rows);
      if (insErr) return false;
    }

    this._requestObjectives.update((list) => [
      ...list.filter((ro) => ro.request_id !== requestId),
      ...objectiveIds.map((oid) => ({ request_id: requestId, objective_id: oid })),
    ]);
    return true;
  }

  async setRequestAssignees(requestId: string, developerIds: string[]): Promise<boolean> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return false;
    }
    const currentUser = this.auth.user();
    const assignedBy = currentUser?.id ?? null;

    const { error: delErr } = await client
      .from('request_assignees')
      .delete()
      .eq('request_id', requestId);
    if (delErr) return false;

    if (developerIds.length > 0) {
      const rows = developerIds.map((did) => ({
        request_id: requestId,
        developer_id: did,
        assigned_by: assignedBy,
      }));
      const { error: insErr } = await client.from('request_assignees').insert(rows);
      if (insErr) return false;
    }

    this._requestAssignees.update((list) => [
      ...list.filter((ra) => ra.request_id !== requestId),
      ...developerIds.map((did) => ({
        request_id: requestId,
        developer_id: did,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy,
      })),
    ]);
    return true;
  }

  /** Expose the current FY year for external callers (e.g. settings default) */
  getCurrentYear(): number {
    return this.currentYear();
  }

  /** Deactivate all objectives for a given team and year (used on period close) */
  async deactivateObjectivesForYear(teamId: string, year: number): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return;
    }
    const { error } = await client
      .from('objectives')
      .update({ is_active: false })
      .eq('team_id', teamId)
      .eq('year', year)
      .eq('is_active', true);
    if (!error) {
      this._objectives.update((list) =>
        list.map((o) =>
          o.team_id === teamId && o.year === year && o.is_active
            ? { ...o, is_active: false, updated_at: new Date().toISOString() }
            : o
        )
      );
    }
  }

  private mapObjective(row: Record<string, unknown>): Objective {
    return {
      id: String(row['id']),
      team_id: String(row['team_id']),
      year: Number(row['year']),
      code: String(row['code']),
      title: String(row['title']),
      description: (row['description'] as string | null) ?? undefined,
      is_active: Boolean(row['is_active']),
      created_at: String(row['created_at']),
      updated_at: String(row['updated_at']),
    };
  }
}
