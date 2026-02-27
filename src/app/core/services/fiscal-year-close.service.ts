import { Injectable, inject, signal, computed } from '@angular/core';
import type { FiscalYearCloseRecord, FYCloseSummary } from '../../shared/models/fiscal-year.model';
import { RequestStoreService } from './request-store.service';
import { FiscalYearService } from './fiscal-year.service';
import { AppContextService } from './app-context.service';
import { AuthService } from '../auth/auth.service';
import { TeamStore } from './team-store.service';
import { UserStoreService } from './user-store.service';
import { SupabaseService } from './supabase.service';
import { ObjectiveStoreService } from './objective-store.service';

const LEGACY_FY_CLOSED_KEY = 'gp_fy_closed';

@Injectable({ providedIn: 'root' })
export class FiscalYearCloseService {
  private store = inject(RequestStoreService);
  private fyService = inject(FiscalYearService);
  private appContext = inject(AppContextService);
  private auth = inject(AuthService);
  private teamStore = inject(TeamStore);
  private userStore = inject(UserStoreService);
  private supabase = inject(SupabaseService);
  private objectiveStore = inject(ObjectiveStoreService);

  private _closedYears = signal<FiscalYearCloseRecord[]>([]);

  constructor() {
    void this.reload();
  }

  readonly closedYears = this._closedYears.asReadonly();

  /** Get closed years for a specific team */
  closedYearsForTeam(teamId: string): FiscalYearCloseRecord[] {
    return this._closedYears().filter((r) => r.teamId === teamId);
  }

  /** Get a specific closed year record */
  getClosedYear(fyKey: string, teamId: string): FiscalYearCloseRecord | null {
    return this._closedYears().find((r) => r.fyKey === fyKey && r.teamId === teamId) ?? null;
  }

  /** Whether the current FY has already been closed for the active team */
  isCurrentYearClosed = computed(() => {
    const teamId = this.appContext.activeTeamId();
    const fyKey = this.fyService.currentFiscalYear().key;
    return this._closedYears().some((r) => r.fyKey === fyKey && r.teamId === teamId);
  });

  /** Count of non-done requests that would be carried over */
  pendingCarryOver = computed(() => {
    const fyKey = this.fyService.currentFiscalYear().key;
    const teamId = this.appContext.activeTeamId();
    return this.store.requests().filter(
      (r) => r.team_id === teamId && r.fiscal_year === fyKey && r.status !== 'done'
    ).length;
  });

  /** Count of completed requests in current FY for active team */
  completedInCurrentFY = computed(() => {
    const fyKey = this.fyService.currentFiscalYear().key;
    const teamId = this.appContext.activeTeamId();
    return this.store.requests().filter(
      (r) => r.team_id === teamId && r.fiscal_year === fyKey && r.status === 'done'
    ).length;
  });

  /** Close the current fiscal year for the given team */
  async closeFiscalYear(teamId: string): Promise<boolean> {
    const user = this.auth.user();
    if (!user) return false;

    const currentFY = this.fyService.currentFiscalYear();
    const fyKey = currentFY.key;
    const closedAt = new Date().toISOString();
    const periodLabel = this.buildClosedPeriodLabel(currentFY.startDate, new Date(closedAt));

    const team = this.teamStore.getById(teamId);
    if (!team) return false;
    const alreadyClosed = this._closedYears().some((r) => r.teamId === teamId && r.fyKey === fyKey);
    if (alreadyClosed) return false;

    const allRequests = this.store.requests().filter(
      (r) => r.team_id === teamId && r.fiscal_year === fyKey
    );

    const completed = allRequests.filter((r) => r.status === 'done');
    const pending = allRequests.filter((r) => r.status !== 'done');

    const byType = { incidencia: 0, mejora: 0, proyecto: 0 };
    const byStatus: Record<string, number> = {};

    for (const r of allRequests) {
      byType[r.type]++;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    }

    const topAchievements = [...completed]
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
      .map((r) => ({
        internal_id: r.internal_id,
        title: r.title,
        developer: this.getDeveloperName(r.developer_id),
        score: r.priorityScore,
      }));

    const avgScore = allRequests.length > 0
      ? allRequests.reduce((sum, r) => sum + r.priorityScore, 0) / allRequests.length
      : 0;

    const summary: FYCloseSummary = {
      totalRequests: allRequests.length,
      completed: completed.length,
      carriedOver: pending.length,
      byType,
      byStatus,
      topAchievements,
      avgPriorityScore: Math.round(avgScore * 100) / 100,
      teamName: team?.name ?? teamId,
    };

    const record: FiscalYearCloseRecord = {
      fyKey,
      teamId,
      label: periodLabel,
      closedAt,
      closedBy: user.id,
      summary,
    };

    this._closedYears.update((list) => [...list, record]);
    const persistOk = await this.persistRecord(record);
    if (!persistOk) {
      this._closedYears.update((list) =>
        list.filter((r) => !(r.fyKey === record.fyKey && r.teamId === record.teamId))
      );
      return false;
    }

    const closingYear = this.objectiveStore.getCurrentYear();
    await this.objectiveStore.deactivateObjectivesForYear(teamId, closingYear);

    const nextFYKey = this.fyService.getNextPeriodKey();
    for (const r of pending) {
      this.store.updateRequest(r.id, {
        fiscal_year: nextFYKey,
        updated_at: new Date().toISOString(),
      });
    }
    await this.fyService.advancePeriod(record.closedAt);
    return true;
  }

  private getDeveloperName(devId: string | null): string {
    if (!devId) return '-';
    const dev = this.userStore.getById(devId);
    return dev?.display_name ?? dev?.email ?? devId;
  }

  /** Format: "Período AA-AA" where AA are last 2 digits of open/close years */
  private buildClosedPeriodLabel(openDate: Date, closeDate: Date): string {
    const openYY = String(openDate.getFullYear()).slice(-2);
    const closeYY = String(closeDate.getFullYear()).slice(-2);
    return `Período ${openYY}-${closeYY}`;
  }

  private async persistRecord(record: FiscalYearCloseRecord): Promise<boolean> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return false;
    }
    const { error } = await client.from('fiscal_closures').insert({
      fy_key: record.fyKey,
      team_id: record.teamId,
      label: record.label,
      closed_at: record.closedAt,
      closed_by: record.closedBy,
      summary: record.summary,
    });
    return !error;
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('FiscalYearCloseService.reload() failed:', err);
      return;
    }
    const { data, error } = await client
      .from('fiscal_closures')
      .select('fy_key,team_id,label,closed_at,closed_by,summary')
      .order('closed_at', { ascending: false });
    if (error) {
      console.error('FiscalYearCloseService.reload() failed:', error);
      return;
    }
    if (!data || data.length === 0) {
      const legacy = this.readLegacyClosedYears();
      if (legacy.length > 0) {
        await client.from('fiscal_closures').upsert(
          legacy.map((r) => ({
            fy_key: r.fyKey,
            team_id: r.teamId,
            label: r.label,
            closed_at: r.closedAt,
            closed_by: r.closedBy,
            summary: r.summary,
          })),
          { onConflict: 'fy_key,team_id' }
        );
        this._closedYears.set(legacy);
      }
      return;
    }
    this._closedYears.set(
      data.map((row) => ({
        fyKey: String(row.fy_key),
        teamId: String(row.team_id),
        label: String(row.label),
        closedAt: String(row.closed_at),
        closedBy: String(row.closed_by),
        summary: row.summary as FYCloseSummary,
      }))
    );
  }

  private readLegacyClosedYears(): FiscalYearCloseRecord[] {
    try {
      const raw = localStorage.getItem(LEGACY_FY_CLOSED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r) => !!r?.fyKey && !!r?.teamId && !!r?.closedAt);
    } catch {
      return [];
    }
  }
}
