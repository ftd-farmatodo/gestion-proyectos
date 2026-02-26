import { Injectable, inject, signal } from '@angular/core';
import type { User, UserRole } from '../auth/auth.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private supabase = inject(SupabaseService);
  private _users = signal<User[]>([]);

  constructor() {
    void this.reload();
  }

  readonly all = this._users.asReadonly();

  getById(id: string): User | undefined {
    return this._users().find((u) => u.id === id);
  }

  byTeam(teamId: string): User[] {
    return this._users().filter((u) => u.team_id === teamId);
  }

  byRoles(roles: UserRole[]): User[] {
    return this._users().filter((u) => roles.includes(u.role));
  }

  async updateUserTeam(userId: string, teamId: string | null): Promise<void> {
    const prev = this.getById(userId);
    if (!prev) return;
    this._users.update((list) =>
      list.map((u) => (u.id === userId ? { ...u, team_id: teamId } : u))
    );
    try {
      await this.persistUser(userId, { team_id: teamId });
    } catch {
      this._users.update((list) => list.map((u) => (u.id === userId ? prev : u)));
      throw new Error('persist_failed');
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const prev = this.getById(userId);
    if (!prev) return;
    this._users.update((list) =>
      list.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    try {
      await this.persistUser(userId, { role });
    } catch {
      this._users.update((list) => list.map((u) => (u.id === userId ? prev : u)));
      throw new Error('persist_failed');
    }
  }

  async updateUserDepartment(userId: string, department: string | null): Promise<void> {
    const prev = this.getById(userId);
    if (!prev) return;
    this._users.update((list) =>
      list.map((u) => (u.id === userId ? { ...u, department } : u))
    );
    try {
      await this.persistUser(userId, { department });
    } catch {
      this._users.update((list) => list.map((u) => (u.id === userId ? prev : u)));
      throw new Error('persist_failed');
    }
  }

  setUsers(users: User[]): void {
    this._users.set(users);
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch (err) {
      console.error('UserStoreService.reload() failed:', err);
      return;
    }
    const { data, error } = await client
      .from('profiles')
      .select('id,email,role,avatar_url,display_name,team_id,department')
      .order('email', { ascending: true });
    if (error) {
      console.error('UserStoreService.reload() failed:', error);
      return;
    }
    if (!data) return;
    this._users.set(
      data.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role as UserRole,
        avatar_url: row.avatar_url,
        display_name: row.display_name ?? undefined,
        team_id: row.team_id,
        department: row.department,
      }))
    );
  }

  private async persistUser(
    userId: string,
    patch: { team_id?: string | null; department?: string | null; role?: UserRole }
  ): Promise<void> {
    const client = this.supabase.requireClient();
    const { error } = await client.from('profiles').update(patch).eq('id', userId);
    if (error) {
      throw error;
    }
  }
}
