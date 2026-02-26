import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import type { User, AuthState } from './auth.model';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _isLoading = signal<boolean>(true);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() != null);
  readonly authState = computed<AuthState>(() => ({
    user: this._user(),
    isLoading: this._isLoading(),
    isAuthenticated: this._user() != null,
  }));

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {
    this.initAuthSync();
  }

  async loginWithGoogle(): Promise<void> {
    try {
      this._isLoading.set(true);
      const client = this.supabase.requireClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async loginAs(_role: 'functional' | 'developer' | 'admin'): Promise<void> {
    await this.loginWithGoogle();
  }

  async logout(): Promise<void> {
    try {
      const client = this.supabase.requireClient();
      await client.auth.signOut();
    } catch {
      // If signOut fails, we still clear local auth state to avoid dead sessions.
    }
    this._user.set(null);
    await this.router.navigate(['/login']);
  }

  hasRole(roles: string[]): boolean {
    const u = this._user();
    return u ? roles.includes(u.role) : false;
  }

  async waitUntilReady(timeoutMs: number = 10000): Promise<void> {
    if (!this._isLoading()) return;
    const started = Date.now();
    while (this._isLoading() && Date.now() - started < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /** Update the current user's team assignment (first-login team selection). */
  async setTeam(teamId: string): Promise<void> {
    const u = this._user();
    if (!u) return;
    let client;
    try { client = this.supabase.requireClient(); } catch { throw new Error('no_client'); }
    const { error } = await client
      .from('profiles')
      .update({ team_id: teamId })
      .eq('id', u.id);
    if (error) throw error;
    this._user.set({ ...u, team_id: teamId });
  }

  /** Update the current user's department/area (first-login or profile edit). */
  async setDepartment(department: string): Promise<void> {
    const u = this._user();
    if (!u) return;
    const client = this.supabase.requireClient();
    const { error } = await client
      .from('profiles')
      .update({ department })
      .eq('id', u.id);
    if (error) throw error;
    this._user.set({ ...u, department });
  }

  private _hydrated = false;
  private _loadingProfile = false;

  private initAuthSync(): void {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._isLoading.set(false);
      return;
    }

    void this.hydrateFromSession();
    client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        this._user.set(null);
        this._isLoading.set(false);
        return;
      }
      if (this._hydrated) {
        void this.loadProfile(session.user.id, session.user.email ?? null);
      }
    });
  }

  private async hydrateFromSession(): Promise<void> {
    try {
      const client = this.supabase.requireClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.user) {
        this._user.set(null);
        return;
      }
      await this.loadProfile(data.session.user.id, data.session.user.email ?? null);
    } finally {
      this._hydrated = true;
      this._isLoading.set(false);
    }
  }

  private async loadProfile(userId: string, fallbackEmail: string | null): Promise<void> {
    if (this._loadingProfile) return;
    this._loadingProfile = true;
    try {
      let client;
      try { client = this.supabase.requireClient(); } catch { this._user.set(null); return; }
      const { data, error } = await client
        .from('profiles')
        .select('id,email,role,avatar_url,display_name,team_id,department')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        this._user.set(null);
        return;
      }

      if (!data) {
        const { data: created, error: createError } = await client
          .from('profiles')
          .upsert({
            id: userId,
            email: fallbackEmail ?? '',
            display_name: fallbackEmail?.split('@')[0] ?? 'Usuario',
          })
          .select('id,email,role,avatar_url,display_name,team_id,department')
          .single();
        if (createError || !created) {
          this._user.set(null);
          return;
        }
        this._user.set(this.toUser(created));
        return;
      }

      this._user.set(this.toUser(data));
    } finally {
      this._loadingProfile = false;
    }
  }

  private toUser(profile: {
    id: string;
    email: string;
    role: User['role'];
    avatar_url: string | null;
    display_name: string | null;
    team_id: string | null;
    department: string | null;
  }): User {
    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      avatar_url: profile.avatar_url,
      display_name: profile.display_name ?? undefined,
      team_id: profile.team_id,
      department: profile.department,
    };
  }
}
