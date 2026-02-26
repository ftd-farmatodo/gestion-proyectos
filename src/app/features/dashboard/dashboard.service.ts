import { Injectable, inject, computed } from '@angular/core';
import type { Request, RequestType } from '../../shared/models/request.model';
import type { User } from '../../core/auth/auth.model';
import { RequestStoreService } from '../../core/services/request-store.service';
import { FocusTrackerService } from '../../core/services/focus-tracker.service';
import { StatusConfigStore } from '../../core/services/status-config.service';
import { AppContextService } from '../../core/services/app-context.service';
import { UserStoreService } from '../../core/services/user-store.service';

/** Badge definition for the recognition system */
export interface RecognitionBadge {
  key: string;
  icon: string;   // emoji or SVG reference
  color: string;  // CSS variable
}

/** Recognition data for a single team member */
export interface RecognitionEntry {
  developer: User;
  completedCount: number;
  totalImpact: number;
  topAchievement: Request | null;
  /** Business-oriented impact statement derived from the top achievement */
  businessImpact: string;
  /** Who benefited from this achievement */
  impactedUsers: string | null;
  /** Type of the top achievement for contextual styling */
  achievementType: RequestType | null;
  badges: RecognitionBadge[];
}

/** KPI summary data for the dashboard header */
export interface KpiData {
  total: number;
  inProgress: number;
  completed: number;
  backlog: number;
}

/** Status breakdown entry for the metrics bar */
export interface StatusBreakdownEntry {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private store = inject(RequestStoreService);
  private focusTracker = inject(FocusTrackerService);
  private statusConfig = inject(StatusConfigStore);
  private appContext = inject(AppContextService);
  private userStore = inject(UserStoreService);

  get requests() {
    return this.store.contextRequests;
  }

  /** High-level KPIs for the summary strip */
  readonly kpis = computed<KpiData>(() => {
    const all = this.store.contextRequests();
    return {
      total: all.length,
      inProgress: all.filter((r) => r.status === 'in_progress' || r.status === 'qa_review').length,
      completed: all.filter((r) => r.status === 'done').length,
      backlog: all.filter((r) => r.status === 'backlog').length,
    };
  });

  /** Status breakdown for the stacked bar in metrics */
  readonly statusBreakdown = computed<StatusBreakdownEntry[]>(() => {
    const all = this.store.contextRequests();
    const total = all.length || 1;
    const statuses = this.statusConfig.active();

    return statuses
      .map((s) => {
        const count = all.filter((r) => r.status === s.key).length;
        return {
          key: s.key,
          label: s.label_es,
          count,
          percentage: (count / total) * 100,
          color: s.color,
          bgColor: s.bgColor,
        };
      })
      .filter((e) => e.count > 0);
  });

  /**
   * Developers with their focus info — scoped to the active team.
   */
  readonly teamFocus = computed(() => {
    const activeTeamId = this.appContext.activeTeamId();
    const devs = this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === activeTeamId
    );
    const allReqs = this.store.contextRequests();
    // Read focusMap to register reactivity
    const focusMap = this.focusTracker.focusMap();

    return devs.map((dev) => {
      const focusedRequest = this.focusTracker.getFocusedRequest(dev.id);
      const assignedTasks = allReqs.filter(
        (r) => r.developer_id === dev.id && r.status !== 'done'
      );
      return {
        developer: dev,
        focusedRequest,
        assignedCount: assignedTasks.length,
      };
    });
  });

  /** Top 5 by priority score (excluding done) */
  readonly priorityQueue = computed(() =>
    [...this.store.contextRequests()]
      .filter((r) => r.status !== 'done')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
  );

  /** Distribution counts for metrics chart */
  readonly metricsDistribution = computed(() => {
    const list = this.store.contextRequests();
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

  /**
   * Recognition data: achievements per developer based on completed tasks.
   * Scoped to the active team context.
   */
  readonly recognition = computed<RecognitionEntry[]>(() => {
    const allReqs = this.store.contextRequests();
    const completed = allReqs.filter((r) => r.status === 'done' && r.developer_id);
    const activeTeamId = this.appContext.activeTeamId();
    const devs = this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === activeTeamId
    );

    // Group completed requests by developer
    const byDev = new Map<string, Request[]>();
    for (const req of completed) {
      const list = byDev.get(req.developer_id!) ?? [];
      list.push(req);
      byDev.set(req.developer_id!, list);
    }

    // Build entries
    const entries: RecognitionEntry[] = devs
      .map((dev) => {
        const devReqs = byDev.get(dev.id) ?? [];
        const completedCount = devReqs.length;
        const totalImpact = devReqs.reduce((sum, r) => sum + r.priorityScore, 0);
        const topAchievement = devReqs.length
          ? devReqs.reduce((top, r) => (r.priorityScore > top.priorityScore ? r : top))
          : null;

        const businessImpact = topAchievement
          ? (topAchievement.expected_benefit
            || topAchievement.business_justification
            || topAchievement.description)
          : '';
        const impactedUsers = topAchievement?.impacted_users ?? null;
        const achievementType = topAchievement?.type ?? null;

        return {
          developer: dev,
          completedCount,
          totalImpact,
          topAchievement,
          businessImpact,
          impactedUsers,
          achievementType,
          badges: [] as RecognitionBadge[],
        };
      })
      .filter((e) => e.completedCount > 0)
      .sort((a, b) => b.totalImpact - a.totalImpact);

    // Assign badges
    const topEntry = entries[0];
    for (const entry of entries) {
      if (entry.completedCount >= 1) {
        entry.badges.push({ key: 'first_delivery', icon: '🚀', color: 'var(--accent)' });
      }
      if (entry.completedCount >= 3) {
        entry.badges.push({ key: 'streak_3', icon: '🔥', color: 'var(--orange)' });
      }
      if (entry.topAchievement && entry.topAchievement.priorityScore >= 4) {
        entry.badges.push({ key: 'high_impact', icon: '⚡', color: 'var(--magenta)' });
      }
      if (entry.completedCount >= 5) {
        entry.badges.push({ key: 'resolver', icon: '🏆', color: 'var(--lime)' });
      }
      if (topEntry && entry === topEntry) {
        entry.badges.push({ key: 'mvp', icon: '🌟', color: 'var(--purple)' });
      }
    }

    return entries;
  });

}
