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
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/**
 * Factory: guard that allows only given roles.
 * Use with canActivate: [authGuard, roleGuard(['developer', 'admin'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(allowedRoles)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}
