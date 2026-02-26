import { Injectable, inject, signal, computed } from '@angular/core';
import type { ActivityEntry } from '../../shared/models/request.model';
import { ActivityStoreService } from '../../core/services/activity-store.service';
import { ActivityLoggerService } from '../../core/services/activity-logger.service';
import { RequestStoreService } from '../../core/services/request-store.service';
import { AppContextService } from '../../core/services/app-context.service';
import { UserStoreService } from '../../core/services/user-store.service';
import { I18nService } from '../../core/services/i18n.service';

export interface DaySummary {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Lunes 10 Feb"
  entries: ActivityEntry[];
}

export interface ActiveBlocker {
  blockerEntry: ActivityEntry;
  requestId: string;
  requestTitle: string;
  requestInternalId: string;
  developerName: string | null;
  reportedBy: string;
  reportedAt: string;
  durationMs: number;
  durationText: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private activityStore = inject(ActivityStoreService);
  private activityLogger = inject(ActivityLoggerService);
  private requestStore = inject(RequestStoreService);
  private appContext = inject(AppContextService);
  private userStore = inject(UserStoreService);
  private i18n = inject(I18nService);

  /** Currently selected week offset (0 = current week, -1 = previous week, etc.) */
  readonly weekOffset = signal(0);

  /** Selected developer filter (null = all) */
  readonly selectedDeveloper = signal<string | null>(null);

  /** Available developers for filter */
  readonly developers = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === teamId
    );
  });

  /** Start of the selected week (Monday) */
  readonly weekStart = computed(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff + this.weekOffset() * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  /** End of the selected week (Friday) */
  readonly weekEnd = computed(() => {
    const start = new Date(this.weekStart());
    start.setDate(start.getDate() + 4); // Friday
    start.setHours(23, 59, 59, 999);
    return start;
  });

  /** Week label, e.g. "10 Feb - 14 Feb 2025" */
  readonly weekLabel = computed(() => {
    const s = this.weekStart();
    const e = this.weekEnd();
    const months = this.monthNames();
    const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
    return `${fmt(s)} – ${fmt(e)} ${e.getFullYear()}`;
  });

  /** Entries filtered by week and developer */
  readonly filteredEntries = computed(() => {
    const startStr = toDateStr(this.weekStart());
    const endStr = toDateStr(this.weekEnd());
    let entries = this.activityStore.getByDateRange(startStr, endStr);
    const dev = this.selectedDeveloper();
    if (dev) {
      entries = entries.filter((e) => e.actor_id === dev);
    }
    return entries;
  });

  /** Entries grouped by day (Monday to Friday) */
  readonly dailySummaries = computed<DaySummary[]>(() => {
    const entries = this.filteredEntries();
    const start = this.weekStart();
    const days: DaySummary[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const dayNames = this.dayNames();
      const months = this.monthNames();
      days.push({
        date: dateStr,
        label: `${dayNames[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
        entries: entries.filter((e) => e.created_at.substring(0, 10) === dateStr),
      });
    }
    return days;
  });

  /** Week summary stats */
  readonly weekStats = computed(() => {
    const entries = this.filteredEntries();
    const requestIds = new Set(entries.map((e) => e.request_id));
    const blockers = entries.filter((e) => e.type === 'blocker_reported').length;
    const resolved = entries.filter((e) => e.type === 'blocker_resolved').length;
    const completed = entries.filter(
      (e) => e.type === 'status_change' && (e.metadata as Record<string, string>)?.['new_status'] === 'done'
    ).length;
    const progressUpdates = entries.filter((e) => e.type === 'progress_update').length;
    return {
      totalEntries: entries.length,
      requestsTouched: requestIds.size,
      activeBlockers: Math.max(0, blockers - resolved),
      completedRequests: completed,
      progressUpdates,
    };
  });

  /** All active (unresolved) blockers for the current team context */
  readonly activeBlockers = computed<ActiveBlocker[]>(() => {
    const allEntries = this.activityStore.sorted();
    const contextRequests = this.requestStore.contextRequests();

    const contextRequestIds = new Set(contextRequests.map((r) => r.id));

    const byRequest = new Map<string, ActivityEntry[]>();
    for (const e of allEntries) {
      if (!contextRequestIds.has(e.request_id)) continue;
      if (e.type !== 'blocker_reported' && e.type !== 'blocker_resolved') continue;
      const list = byRequest.get(e.request_id) ?? [];
      list.push(e);
      byRequest.set(e.request_id, list);
    }

    const now = Date.now();
    const blockers: ActiveBlocker[] = [];

    for (const [requestId, entries] of byRequest) {
      const chronological = [...entries].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let openBlocker: ActivityEntry | null = null;
      for (const e of chronological) {
        if (e.type === 'blocker_reported') openBlocker = e;
        if (e.type === 'blocker_resolved') openBlocker = null;
      }

      if (!openBlocker) continue;

      const req = contextRequests.find((r) => r.id === requestId);
      if (!req) continue;

      const dev = req.developer_id ? this.userStore.getById(req.developer_id) : null;
      const durationMs = now - new Date(openBlocker.created_at).getTime();

      blockers.push({
        blockerEntry: openBlocker,
        requestId: req.id,
        requestTitle: req.title,
        requestInternalId: req.internal_id,
        developerName: dev?.display_name ?? dev?.email ?? null,
        reportedBy: openBlocker.actor_name,
        reportedAt: openBlocker.created_at,
        durationMs,
        durationText: this.formatDuration(durationMs),
        description: openBlocker.description,
      });
    }

    return blockers.sort((a, b) => b.durationMs - a.durationMs);
  });

  resolveBlocker(blocker: ActiveBlocker): void {
    const req = this.requestStore.contextRequests().find((r) => r.id === blocker.requestId);
    if (!req) return;

    const durationMs = Date.now() - new Date(blocker.blockerEntry.created_at).getTime();
    const durationText = this.formatDuration(durationMs);

    const desc = this.i18n.t('tracking.blockerResolvedDesc').replace('{duration}', durationText);
    this.activityLogger.log({
      request_id: req.id,
      request_internal_id: req.internal_id,
      request_title: req.title,
      team_id: req.team_id,
      fiscal_year: req.fiscal_year,
      type: 'blocker_resolved',
      description: desc,
    });
  }

  previousWeek(): void {
    this.weekOffset.update((v) => v - 1);
  }

  nextWeek(): void {
    this.weekOffset.update((v) => v + 1);
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
  }

  private dayNames(): string[] {
    return [
      this.i18n.t('tracking.daySun'), this.i18n.t('tracking.dayMon'), this.i18n.t('tracking.dayTue'),
      this.i18n.t('tracking.dayWed'), this.i18n.t('tracking.dayThu'), this.i18n.t('tracking.dayFri'),
      this.i18n.t('tracking.daySat'),
    ];
  }

  private monthNames(): string[] {
    return [
      this.i18n.t('tracking.monthJan'), this.i18n.t('tracking.monthFeb'), this.i18n.t('tracking.monthMar'),
      this.i18n.t('tracking.monthApr'), this.i18n.t('tracking.monthMay'), this.i18n.t('tracking.monthJun'),
      this.i18n.t('tracking.monthJul'), this.i18n.t('tracking.monthAug'), this.i18n.t('tracking.monthSep'),
      this.i18n.t('tracking.monthOct'), this.i18n.t('tracking.monthNov'), this.i18n.t('tracking.monthDec'),
    ];
  }

  private formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${this.i18n.t('tracking.durationDays')}`);
    if (hours > 0) parts.push(`${hours} ${this.i18n.t('tracking.durationHours')}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ${this.i18n.t('tracking.durationMinutes')}`);
    return parts.join(' ');
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().substring(0, 10);
}

