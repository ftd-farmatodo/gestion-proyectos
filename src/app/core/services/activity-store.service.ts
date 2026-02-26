import { Injectable, inject, signal, computed } from '@angular/core';
import type { ActivityEntry } from '../../shared/models/request.model';
import { AppContextService } from './app-context.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ActivityStoreService {
  private appContext = inject(AppContextService);
  private supabase = inject(SupabaseService);
  private _entries = signal<ActivityEntry[]>([]);
  private channelName = `activity-sync-${Math.random().toString(36).slice(2, 8)}`;
  private _reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.reload();
    this.setupRealtime();
  }

  readonly entries = this._entries.asReadonly();

  /** All entries sorted newest first */
  readonly sorted = computed(() => {
    const teamId = this.appContext.activeTeamId();
    const fy = this.appContext.activeFiscalYear();
    return [...this._entries()]
      .filter((e) => {
        const teamOk = !e.team_id || e.team_id === teamId;
        const fyOk = !e.fiscal_year || e.fiscal_year === fy;
        return teamOk && fyOk;
      })
      .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  });

  /** Most recent N entries */
  recent(limit: number = 10) {
    return this.sorted().slice(0, limit);
  }

  /** Entries for a specific request */
  getByRequest(requestId: string): ActivityEntry[] {
    return this.sorted().filter((e) => e.request_id === requestId);
  }

  /** Entries by a specific actor */
  getByActor(actorId: string): ActivityEntry[] {
    return this.sorted().filter((e) => e.actor_id === actorId);
  }

  /** Entries within a date range (inclusive, comparing date strings YYYY-MM-DD) */
  getByDateRange(startDate: string, endDate: string): ActivityEntry[] {
    return this.sorted().filter((e) => {
      const d = e.created_at.substring(0, 10);
      return d >= startDate && d <= endDate;
    });
  }

  /** Check if a request has an active (unresolved) blocker */
  hasActiveBlocker(requestId: string): boolean {
    const entries = this.getByRequest(requestId);
    let blockerCount = 0;
    for (const e of [...entries].reverse()) {
      if (e.type === 'blocker_reported') blockerCount++;
      if (e.type === 'blocker_resolved') blockerCount--;
    }
    return blockerCount > 0;
  }

  /** Number of distinct requests with active (unresolved) blockers in current context */
  readonly activeBlockerCount = computed(() => {
    const contextEntries = this.sorted();
    const balanceByRequest = new Map<string, number>();
    const chronological = [...contextEntries].reverse();
    for (const e of chronological) {
      if (e.type === 'blocker_reported') {
        balanceByRequest.set(e.request_id, (balanceByRequest.get(e.request_id) ?? 0) + 1);
      } else if (e.type === 'blocker_resolved') {
        balanceByRequest.set(e.request_id, (balanceByRequest.get(e.request_id) ?? 0) - 1);
      }
    }
    let count = 0;
    for (const balance of balanceByRequest.values()) {
      if (balance > 0) count++;
    }
    return count;
  });

  addEntry(entry: ActivityEntry): void {
    this._entries.update((list) => [entry, ...list]);
    void this.persistInsert(entry);
  }

  setEntries(entries: ActivityEntry[]): void {
    this._entries.set(entries);
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('ActivityStoreService.reload() failed:', err);
      return;
    }
    const { data, error } = await client
      .from('activity_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('ActivityStoreService.reload() failed:', error);
      return;
    }
    if (!data) return;
    this._entries.set(data as ActivityEntry[]);
  }

  private async persistInsert(entry: ActivityEntry): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return;
    }
    const { error } = await client.from('activity_entries').insert(entry);
    if (error) {
      this._entries.update((list) => list.filter((e) => e.id !== entry.id));
    }
  }

  private setupRealtime(): void {
    const channel = this.supabase.channel(this.channelName);
    if (!channel) return;
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_entries' },
        () => {
          if (this._reloadTimer) clearTimeout(this._reloadTimer);
          this._reloadTimer = setTimeout(() => void this.reload(), 300);
        }
      )
      .subscribe();
  }
}
