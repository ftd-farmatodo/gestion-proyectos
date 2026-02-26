import { Injectable, inject, signal, computed } from '@angular/core';
import type { StatusConfig } from '../../shared/models/request.model';
import { SupabaseService } from './supabase.service';

/**
 * Configurable status pipeline — single source of truth.
 * Currently loaded from mock data; when Supabase is connected,
 * replace `setStatuses()` call with a real-time subscription
 * to a `status_config` table.
 */
@Injectable({ providedIn: 'root' })
export class StatusConfigStore {
  private supabase = inject(SupabaseService);
  private _statuses = signal<StatusConfig[]>([]);

  constructor() {
    void this.reload();
  }

  /** All statuses (active + inactive) */
  readonly all = this._statuses.asReadonly();

  /** Only active statuses, sorted by pipeline order */
  readonly active = computed(() =>
    [...this._statuses()]
      .filter((s) => s.is_active)
      .sort((a, b) => a.order - b.order)
  );

  /** Get config for a specific status key */
  getByKey(key: string): StatusConfig | undefined {
    return this._statuses().find((s) => s.key === key);
  }

  /** Get allowed transitions for a given status key */
  getAllowedTransitions(currentStatus: string): StatusConfig[] {
    const current = this.getByKey(currentStatus);
    if (!current) return [];
    return current.allowed_transitions
      .map((k) => this.getByKey(k))
      .filter((s): s is StatusConfig => s !== undefined && s.is_active);
  }

  /** Get localized label */
  getLabel(key: string, locale: string): string {
    const cfg = this.getByKey(key);
    if (!cfg) return key;
    return locale === 'en' ? cfg.label_en : cfg.label_es;
  }

  /** Replace all statuses (e.g. from database fetch) */
  async setStatuses(statuses: StatusConfig[]): Promise<void> {
    const normalized = this.normalize(statuses);
    const prev = this._statuses();
    this._statuses.set(normalized);
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._statuses.set(prev);
      throw new Error('persist_failed');
    }
    const { error } = await client.from('status_config').upsert(normalized.map(toRow));
    if (error) {
      this._statuses.set(prev);
      throw new Error('persist_failed');
    }
  }

  /** Add or update a single status */
  async upsertStatus(status: StatusConfig): Promise<void> {
    const prev = this._statuses();
    const idx = prev.findIndex((s) => s.key === status.key);
    const normalizedStatus = this.normalizeOne(status);
    const next =
      idx >= 0
        ? this.normalize(prev.map((s, i) => (i === idx ? normalizedStatus : s)))
        : this.normalize([...prev, normalizedStatus]);
    this._statuses.set(next);
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._statuses.set(prev);
      throw new Error('persist_failed');
    }
    const row = toRow(normalizedStatus);
    const { error } = idx >= 0
      ? await client.from('status_config').upsert(row)
      : await client.from('status_config').insert(row);
    if (error) {
      this._statuses.set(prev);
      throw new Error('persist_failed');
    }
  }

  private normalizeOne(status: StatusConfig): StatusConfig {
    const key = status.key.trim().toLowerCase();
    return {
      ...status,
      key,
      label_es: status.label_es.trim(),
      label_en: status.label_en.trim() || status.label_es.trim(),
      order: Number.isFinite(status.order) ? status.order : 0,
      allowed_transitions: [...new Set(status.allowed_transitions.map((k) => k.trim().toLowerCase()))],
    };
  }

  private normalize(statuses: StatusConfig[]): StatusConfig[] {
    const list = statuses.map((s) => this.normalizeOne(s));
    const keys = new Set(list.map((s) => s.key));
    return list.map((s) => ({
      ...s,
      allowed_transitions: s.allowed_transitions.filter((k) => k !== s.key && keys.has(k)),
    }));
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('StatusConfigStore.reload() failed:', err);
      if (this._statuses().length === 0) {
        this._statuses.set(DEFAULT_STATUSES);
      }
      return;
    }
    const { data, error } = await client
      .from('status_config')
      .select('*')
      .order('order', { ascending: true });
    if (error) {
      console.error('StatusConfigStore.reload() failed:', error);
      return;
    }
    if (!data || data.length === 0) {
      await client.from('status_config').upsert(DEFAULT_STATUSES.map(toRow));
      this._statuses.set(DEFAULT_STATUSES);
      return;
    }
    this._statuses.set(this.normalize(data.map(fromRow)));
  }
}

/** Map DB row (bg_color) -> model (bgColor) */
function fromRow(row: Record<string, unknown>): StatusConfig {
  return {
    key: String(row['key']),
    label_es: String(row['label_es']),
    label_en: String(row['label_en']),
    color: String(row['color']),
    bgColor: String(row['bg_color'] ?? ''),
    order: Number(row['order'] ?? 0),
    allowed_transitions: Array.isArray(row['allowed_transitions']) ? row['allowed_transitions'] as string[] : [],
    is_active: row['is_active'] !== false,
  };
}

/** Map model (bgColor) -> DB row (bg_color) */
function toRow(s: StatusConfig): Record<string, unknown> {
  return {
    key: s.key,
    label_es: s.label_es,
    label_en: s.label_en,
    color: s.color,
    bg_color: s.bgColor,
    order: s.order,
    allowed_transitions: s.allowed_transitions,
    is_active: s.is_active,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Default status pipeline — simulates what would come from a
 * `status_config` database table.
 */
const DEFAULT_STATUSES: StatusConfig[] = [
  {
    key: 'backlog',
    label_es: 'Backlog',
    label_en: 'Backlog',
    color: 'var(--cool-gray)',
    bgColor: 'color-mix(in srgb, var(--cool-gray) 12%, transparent)',
    order: 0,
    allowed_transitions: ['prioritized', 'cancelled'],
    is_active: true,
  },
  {
    key: 'prioritized',
    label_es: 'Priorizado',
    label_en: 'Prioritized',
    color: 'var(--orange)',
    bgColor: 'color-mix(in srgb, var(--orange) 12%, transparent)',
    order: 1,
    allowed_transitions: ['in_progress', 'backlog', 'cancelled'],
    is_active: true,
  },
  {
    key: 'in_progress',
    label_es: 'En progreso',
    label_en: 'In Progress',
    color: 'var(--primary-light)',
    bgColor: 'color-mix(in srgb, var(--primary-light) 12%, transparent)',
    order: 2,
    allowed_transitions: ['qa_review', 'done', 'prioritized', 'cancelled'],
    is_active: true,
  },
  {
    key: 'qa_review',
    label_es: 'En revisión',
    label_en: 'QA Review',
    color: 'var(--purple)',
    bgColor: 'color-mix(in srgb, var(--purple) 12%, transparent)',
    order: 3,
    allowed_transitions: ['done', 'in_progress'],
    is_active: true,
  },
  {
    key: 'done',
    label_es: 'Completado',
    label_en: 'Completed',
    color: 'var(--lime)',
    bgColor: 'color-mix(in srgb, var(--lime) 12%, transparent)',
    order: 4,
    allowed_transitions: ['backlog'],
    is_active: true,
  },
  {
    key: 'cancelled',
    label_es: 'Cancelado',
    label_en: 'Cancelled',
    color: 'var(--magenta)',
    bgColor: 'color-mix(in srgb, var(--magenta) 12%, transparent)',
    order: 5,
    allowed_transitions: ['backlog'],
    is_active: true,
  },
];
