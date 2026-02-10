import { Injectable, signal, computed } from '@angular/core';
import type { Request } from '../../shared/models/request.model';
import { MOCK_REQUESTS } from '../../data/mock-data';

/**
 * Global store for requests. Single source of truth for all features.
 * When Supabase is connected, this will sync from real-time channel.
 */
@Injectable({ providedIn: 'root' })
export class RequestStoreService {
  private _requests = signal<Request[]>(MOCK_REQUESTS);

  readonly requests = this._requests.asReadonly();

  setRequests(requests: Request[]): void {
    this._requests.set(requests);
  }

  updateRequest(id: string, patch: Partial<Request>): void {
    this._requests.update((list) =>
      list.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  addRequest(request: Request): void {
    this._requests.update((list) => [request, ...list]);
  }
}
