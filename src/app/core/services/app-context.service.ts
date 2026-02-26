import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FiscalYearService } from './fiscal-year.service';
import { TeamStore } from './team-store.service';

const STORAGE_KEY = 'gp_app_context';

interface PersistedContext {
  teamId: string | null;
  userId?: string | null;
}

/**
 * Central "lens" that controls which team the app displays.
 * Fiscal year is always the current one (no manual switching).
 */
@Injectable({ providedIn: 'root' })
export class AppContextService {
  private auth = inject(AuthService);
  private fyService = inject(FiscalYearService);
  private teamStore = inject(TeamStore);

  /** Writable signal for the currently viewed team */
  private _activeTeamId = signal<string | null>(null);

  /** The team ID being viewed. Falls back to user's team, then first active team. */
  readonly activeTeamId = computed<string>(() => {
    const explicit = this._activeTeamId();
    if (explicit && this.isActiveTeam(explicit)) return explicit;
    const user = this.auth.user();
    if (user?.team_id && this.isActiveTeam(user.team_id)) return user.team_id;
    const teams = this.teamStore.activeTeams();
    return teams.length > 0 ? teams[0].id : '';
  });

  /** Always returns the current fiscal year key */
  readonly activeFiscalYear = computed<string>(() => {
    return this.fyService.currentFiscalYear().key;
  });

  /** Name of the active team (for display) */
  readonly activeTeamName = computed(() => {
    const team = this.teamStore.getById(this.activeTeamId());
    return team?.name ?? '';
  });

  /** True if viewing the logged-in user's own team */
  readonly isViewingOwnTeam = computed(() => {
    const user = this.auth.user();
    return user?.team_id === this.activeTeamId();
  });

  /** True when the user cannot make changes (viewing another team) */
  readonly isReadOnly = computed(() => {
    return !this.isViewingOwnTeam();
  });

  constructor() {
    this.restoreFromStorage();

    effect(() => {
      const ctx: PersistedContext = {
        teamId: this._activeTeamId(),
        userId: this.auth.user()?.id ?? null,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
      } catch { /* ignore */ }
    });

    effect(() => {
      const storedTeamId = this._activeTeamId();
      const teams = this.teamStore.activeTeams();
      if (storedTeamId && teams.length > 0 && !this.isActiveTeam(storedTeamId)) {
        this._activeTeamId.set(null);
      }
    });
  }

  /** Switch to viewing a different team */
  switchTeam(teamId: string): void {
    const user = this.auth.user();
    const canCrossTeamRead = this.auth.hasRole(['admin', 'functional']);
    if (!canCrossTeamRead && user?.team_id !== teamId) return;
    if (!this.isActiveTeam(teamId)) return;
    this._activeTeamId.set(teamId);
  }

  /** Reset to the user's own team */
  resetToMyContext(): void {
    this._activeTeamId.set(null);
  }

  private restoreFromStorage(): void {
    try {
      const user = this.auth.user();
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (user?.team_id && this.isActiveTeam(user.team_id)) this._activeTeamId.set(user.team_id);
        return;
      }
      const parsed = JSON.parse(raw) as PersistedContext;

      // Avoid carrying context across different users/sessions.
      const isDifferentUser = !!(parsed.userId && user?.id && parsed.userId !== user.id);
      const isLegacyContext = parsed.userId === undefined;

      if (isDifferentUser || isLegacyContext) {
        if (user?.team_id && this.isActiveTeam(user.team_id)) this._activeTeamId.set(user.team_id);
        return;
      }

      if (parsed.teamId && this.isActiveTeam(parsed.teamId)) {
        this._activeTeamId.set(parsed.teamId);
        return;
      }

      if (user?.team_id && this.isActiveTeam(user.team_id)) this._activeTeamId.set(user.team_id);
    } catch { /* ignore */ }
  }

  private isActiveTeam(teamId: string): boolean {
    return this.teamStore.activeTeams().some((t) => t.id === teamId);
  }
}
