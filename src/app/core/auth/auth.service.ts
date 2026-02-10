import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { User, AuthState } from './auth.model';
import { MOCK_USERS } from '../../data/mock-data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _isLoading = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() != null);
  readonly authState = computed<AuthState>(() => ({
    user: this._user(),
    isLoading: this._isLoading(),
    isAuthenticated: this._user() != null,
  }));

  constructor(private router: Router) {}

  /**
   * Mock: simulates Google login. In production, replace with Supabase auth.signInWithOAuth({ provider: 'google' }).
   * Validates that email domain matches environment.allowedEmailDomain.
   */
  async loginWithGoogle(): Promise<void> {
    this._isLoading.set(true);
    try {
      // Mock: pick first user as "logged in" (simulate Google returning this user).
      // When using Supabase: get session, then fetch profile by id and check email domain.
      const allowedDomain = environment.allowedEmailDomain?.toLowerCase() ?? '';
      const mockLoggedUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase().endsWith(`@${allowedDomain}`)
      ) ?? MOCK_USERS[0];
      this._user.set(mockLoggedUser);
      this.router.navigate(['/dashboard']);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Login as a specific mock user by role (for development/demo).
   */
  loginAs(role: 'functional' | 'developer' | 'admin'): void {
    const u = MOCK_USERS.find((x) => x.role === role) ?? MOCK_USERS[0];
    this._user.set(u);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(roles: string[]): boolean {
    const u = this._user();
    return u ? roles.includes(u.role) : false;
  }
}
