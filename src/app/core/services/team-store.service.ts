import { Injectable, inject, signal, computed } from '@angular/core';
import type { Team } from '../../shared/models/team.model';
import { SupabaseService } from './supabase.service';

/** Default teams seeded on first load */
const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-ti',
    name: 'Tecnologia de la Informacion',
    code: 'TI',
    description: 'Equipo de desarrollo, infraestructura y soporte TI',
    icon: '💻',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'team-ops',
    name: 'Operaciones',
    code: 'OPS',
    description: 'Equipo de operaciones y logistica',
    icon: '📦',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
];

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private supabase = inject(SupabaseService);
  private _teams = signal<Team[]>([]);

  constructor() {
    void this.reload();
  }

  /** All teams (active + inactive) */
  readonly all = this._teams.asReadonly();

  /** Only active teams, sorted by name */
  readonly activeTeams = computed(() =>
    [...this._teams()]
      .filter((t) => t.is_active)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  /** Get a team by ID */
  getById(id: string): Team | undefined {
    return this._teams().find((t) => t.id === id);
  }

  /** Add a new team */
  async addTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const normalizedName = team.name.trim();
    const normalizedCode = team.code.trim().toUpperCase();
    if (!normalizedName) throw new Error('team_name_required');
    if (!normalizedCode) throw new Error('team_code_required');
    if (this.hasName(normalizedName)) throw new Error('team_name_duplicate');
    if (this.hasCode(normalizedCode)) throw new Error('team_code_duplicate');

    const newTeam: Team = {
      ...team,
      name: normalizedName,
      code: normalizedCode,
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this._teams.update((list) => [...list, newTeam]);
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._teams.update((list) => list.filter((t) => t.id !== newTeam.id));
      throw new Error('persist_failed');
    }
    const { error } = await client.from('teams').insert(newTeam);
    if (error) {
      this._teams.update((list) => list.filter((t) => t.id !== newTeam.id));
      throw new Error('persist_failed');
    }
    return newTeam;
  }

  /** Update an existing team */
  async updateTeam(id: string, patch: Partial<Omit<Team, 'id' | 'created_at'>>): Promise<void> {
    const current = this.getById(id);
    if (!current) return;
    const nextName = patch.name?.trim() ?? current.name;
    const nextCode = patch.code?.trim().toUpperCase() ?? current.code;
    if (!nextName) throw new Error('team_name_required');
    if (!nextCode) throw new Error('team_code_required');
    if (this.hasName(nextName, id)) throw new Error('team_name_duplicate');
    if (this.hasCode(nextCode, id)) throw new Error('team_code_duplicate');

    const prev = current;
    this._teams.update((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, ...patch, name: nextName, code: nextCode }
          : t
      )
    );
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._teams.update((list) => list.map((t) => (t.id === id ? prev : t)));
      throw new Error('persist_failed');
    }
    const { error } = await client
      .from('teams')
      .update({ ...patch, name: nextName, code: nextCode })
      .eq('id', id);
    if (error) {
      this._teams.update((list) => list.map((t) => (t.id === id ? prev : t)));
      throw new Error('persist_failed');
    }
  }

  /** Toggle active/inactive status */
  async toggleActive(id: string): Promise<void> {
    const prev = this.getById(id);
    if (!prev) return;
    const next = { ...prev, is_active: !prev.is_active };
    this._teams.update((list) => list.map((t) => (t.id === id ? next : t)));
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._teams.update((list) => list.map((t) => (t.id === id ? prev : t)));
      throw new Error('persist_failed');
    }
    const { error } = await client.from('teams').update({ is_active: next.is_active }).eq('id', id);
    if (error) {
      this._teams.update((list) => list.map((t) => (t.id === id ? prev : t)));
      throw new Error('persist_failed');
    }
  }

  async removeTeam(id: string): Promise<void> {
    const prev = this.getById(id);
    if (!prev) return;
    this._teams.update((list) => list.filter((t) => t.id !== id));
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._teams.update((list) => [...list, prev].sort((a, b) => a.name.localeCompare(b.name)));
      throw new Error('persist_failed');
    }
    const { error } = await client.from('teams').delete().eq('id', id);
    if (error) {
      this._teams.update((list) => [...list, prev].sort((a, b) => a.name.localeCompare(b.name)));
      throw new Error('persist_failed');
    }
  }

  async ensureTeamActive(id: string): Promise<void> {
    const team = this.getById(id);
    if (!team) return;
    if (team.is_active) return;
    await this.updateTeam(id, { is_active: true });
  }

  /** Replace all teams (e.g. from database sync) */
  setTeams(teams: Team[]): void {
    this._teams.set(teams);
  }

  /** Backfill missing fields (e.g. `code`) for teams stored before a schema change */
  private migrateTeams(teams: Team[]): Team[] {
    let changed = false;
    const result = teams.map((t) => {
      if (t.code) return t;
      changed = true;
      const defaultMatch = DEFAULT_TEAMS.find((d) => d.id === t.id);
      const code = defaultMatch?.code ?? this.deriveCode(t.name);
      return { ...t, code };
    });
    return changed ? result : teams;
  }

  /** Generate a short uppercase code from a team name (first letters of each word) */
  private deriveCode(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 4) || 'TEAM';
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      if (this._teams().length === 0) {
        this._teams.set(DEFAULT_TEAMS);
      }
      return;
    }
    const { data, error } = await client.from('teams').select('*').order('name', { ascending: true });
    if (error) return;
    if (!data || data.length === 0) {
      await client.from('teams').upsert(DEFAULT_TEAMS);
      this._teams.set(DEFAULT_TEAMS);
      return;
    }
    this._teams.set(this.migrateTeams(data as Team[]));
  }

  private hasName(name: string, excludeId?: string): boolean {
    const normalized = name.trim().toLowerCase();
    return this._teams().some(
      (t) => t.id !== excludeId && t.name.trim().toLowerCase() === normalized
    );
  }

  private hasCode(code: string, excludeId?: string): boolean {
    const normalized = code.trim().toUpperCase();
    return this._teams().some(
      (t) => t.id !== excludeId && t.code.trim().toUpperCase() === normalized
    );
  }
}
