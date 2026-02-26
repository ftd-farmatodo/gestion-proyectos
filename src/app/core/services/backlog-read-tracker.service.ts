import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { RequestStoreService } from './request-store.service';
import { AuthService } from '../auth/auth.service';

const STORAGE_PREFIX = 'gp_backlog_read_';

/**
 * Tracks which backlog requests the current user has already "seen".
 * Uses localStorage keyed by user ID so each user has their own read set.
 * Provides a reactive `unreadCount` signal for badge display.
 */
@Injectable({ providedIn: 'root' })
export class BacklogReadTrackerService {
  private store = inject(RequestStoreService);
  private auth = inject(AuthService);

  /** Signal holding the set of request IDs the current user has viewed */
  private _readIds = signal<Set<string>>(new Set());

  constructor() {
    // Restore from localStorage whenever the user changes
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this._readIds.set(this.loadFromStorage(user.id));
      } else {
        this._readIds.set(new Set());
      }
    }, { allowSignalWrites: true });
  }

  /** All backlog requests (status === 'backlog'), scoped to current context */
  private backlogRequests = computed(() =>
    this.store.contextRequests().filter((r) => r.status === 'backlog')
  );

  /** Number of unread backlog items for the current user */
  readonly unreadCount = computed(() => {
    const backlog = this.backlogRequests();
    const read = this._readIds();
    return backlog.filter((r) => !read.has(r.id)).length;
  });

  /** IDs of unread backlog requests */
  readonly unreadIds = computed(() => {
    const backlog = this.backlogRequests();
    const read = this._readIds();
    return new Set(backlog.filter((r) => !read.has(r.id)).map((r) => r.id));
  });

  /** Mark a single request as read */
  markAsRead(requestId: string): void {
    const current = this._readIds();
    if (current.has(requestId)) return;
    const next = new Set(current);
    next.add(requestId);
    this._readIds.set(next);
    this.persistToStorage(next);
  }

  /** Mark all current backlog requests as read */
  markAllAsRead(): void {
    const backlog = this.backlogRequests();
    const current = this._readIds();
    const next = new Set(current);
    let changed = false;
    for (const r of backlog) {
      if (!next.has(r.id)) {
        next.add(r.id);
        changed = true;
      }
    }
    if (changed) {
      this._readIds.set(next);
      this.persistToStorage(next);
    }
  }

  /** Check if a specific request has been read */
  isRead(requestId: string): boolean {
    return this._readIds().has(requestId);
  }

  // ── localStorage helpers ──────────────────────────────

  private storageKey(): string | null {
    const user = this.auth.user();
    return user ? `${STORAGE_PREFIX}${user.id}` : null;
  }

  private loadFromStorage(userId: string): Set<string> {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set<string>(arr);
      }
    } catch { /* ignore parse errors */ }
    return new Set();
  }

  private persistToStorage(ids: Set<string>): void {
    const key = this.storageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify([...ids]));
    } catch { /* storage full — silently fail */ }
  }
}
