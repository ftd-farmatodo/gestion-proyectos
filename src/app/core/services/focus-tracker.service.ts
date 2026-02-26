import { Injectable, inject, signal, computed } from '@angular/core';
import { RequestStoreService } from './request-store.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from '../../shared/models/request.model';

const STORAGE_KEY = 'gp_focus_';

/**
 * Tracks which request each developer is currently focused on.
 * Persisted in localStorage keyed by user ID.
 * When no focus is set, consumers can fall back to showing assigned task count.
 */
@Injectable({ providedIn: 'root' })
export class FocusTrackerService {
  private store = inject(RequestStoreService);
  private auth = inject(AuthService);

  /**
   * Map of userId -> requestId representing each developer's focused task.
   * Reactive signal so dashboard recomputes when focus changes.
   */
  private _focusMap = signal<Record<string, string>>({});

  constructor() {
    this.restoreAll();
  }

  /** Get the focused request ID for a given user */
  getFocusedRequestId(userId: string): string | null {
    return this._focusMap()[userId] ?? null;
  }

  /** Get the focused Request object for a given user (null if not set or request no longer exists).
   *  Pure read — never writes signals, safe to call inside computed(). */
  getFocusedRequest(userId: string): Request | null {
    const reqId = this.getFocusedRequestId(userId);
    if (!reqId) return null;
    const req = this.store.requests().find((r) => r.id === reqId);
    // If the request no longer exists or is no longer assigned, treat as no focus
    if (!req || req.developer_id !== userId) {
      return null;
    }
    return req;
  }

  /** Set focus for the current logged-in user */
  setMyFocus(requestId: string): void {
    const user = this.auth.user();
    if (!user) return;
    this._focusMap.update((map) => ({ ...map, [user.id]: requestId }));
    this.persistFocus(user.id, requestId);
  }

  /** Clear focus for the current logged-in user */
  clearMyFocus(): void {
    const user = this.auth.user();
    if (!user) return;
    this.clearFocus(user.id);
  }

  /** Check if a given request is the current user's focused task */
  isMyFocus(requestId: string): boolean {
    const user = this.auth.user();
    if (!user) return false;
    return this._focusMap()[user.id] === requestId;
  }

  /** Set focus for any user (used to set focus on behalf of a developer) */
  setFocus(userId: string, requestId: string): void {
    this._focusMap.update((map) => ({ ...map, [userId]: requestId }));
    this.persistFocus(userId, requestId);
  }

  /** Clear focus for a specific user */
  clearFocus(userId: string): void {
    this._focusMap.update((map) => {
      const copy = { ...map };
      delete copy[userId];
      return copy;
    });
    try {
      localStorage.removeItem(`${STORAGE_KEY}${userId}`);
    } catch { /* ignore */ }
  }

  /** Expose the map as readonly for computed derivations */
  readonly focusMap = this._focusMap.asReadonly();

  // ── localStorage helpers ──

  private persistFocus(userId: string, requestId: string): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}${userId}`, requestId);
    } catch { /* ignore */ }
  }

  private restoreAll(): void {
    try {
      const map: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY)) {
          const userId = key.slice(STORAGE_KEY.length);
          const reqId = localStorage.getItem(key);
          if (reqId) map[userId] = reqId;
        }
      }
      this._focusMap.set(map);
    } catch { /* ignore */ }
  }
}
