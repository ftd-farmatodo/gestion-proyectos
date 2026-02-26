import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard: allows access only when user is authenticated.
 * Redirects to /login otherwise.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoading()) {
    return auth.waitUntilReady().then(() => (auth.isAuthenticated() ? true : router.createUrlTree(['/login'])));
  }
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/**
 * Guard: ensures the user has selected a team before accessing the app.
 * Waits for auth hydration so the profile (with team_id) is fully loaded
 * before evaluating. Redirects to /team-setup only on first-time setup.
 */
export const teamSetupGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoading()) {
    await auth.waitUntilReady();
  }
  const user = auth.user();
  if (user && user.team_id) {
    return true;
  }
  return router.createUrlTree(['/team-setup']);
};

/**
 * Guard: ensures the user has selected a department/area before accessing the app.
 * Waits for auth hydration so the profile (with department) is fully loaded
 * before evaluating. Redirects to /department-setup only on first-time setup.
 */
export const departmentSetupGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoading()) {
    await auth.waitUntilReady();
  }
  const user = auth.user();
  if (user && user.department) {
    return true;
  }
  return router.createUrlTree(['/department-setup']);
};

/**
 * Factory: guard that allows only given roles.
 * Use with canActivate: [authGuard, roleGuard(['developer', 'admin'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoading()) {
      await auth.waitUntilReady();
    }
    if (auth.hasRole(allowedRoles)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}
