import { Injectable, inject } from '@angular/core';
import type { ActivityEntry, ActivityType } from '../../shared/models/request.model';
import { ActivityStoreService } from './activity-store.service';
import { AuthService } from '../auth/auth.service';
import { AppContextService } from './app-context.service';

type LogPayload = {
  request_id: string;
  request_title: string;
  request_internal_id?: string;
  team_id?: string;
  fiscal_year?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class ActivityLoggerService {
  private activityStore = inject(ActivityStoreService);
  private auth = inject(AuthService);
  private appContext = inject(AppContextService);

  log(payload: LogPayload): ActivityEntry {
    const user = this.auth.user();
    const entry: ActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      request_id: payload.request_id,
      request_internal_id: payload.request_internal_id,
      request_title: payload.request_title,
      actor_id: user?.id ?? null,
      actor_name: user?.display_name ?? user?.email ?? 'Sistema',
      team_id: payload.team_id ?? this.appContext.activeTeamId(),
      fiscal_year: payload.fiscal_year ?? this.appContext.activeFiscalYear(),
      type: payload.type,
      description: payload.description,
      metadata: payload.metadata,
      created_at: new Date().toISOString(),
    };
    this.activityStore.addEntry(entry);
    return entry;
  }
}
