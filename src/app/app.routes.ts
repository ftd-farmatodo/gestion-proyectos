import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'submissions',
    loadChildren: () =>
      import('./features/submissions/submissions.routes').then(
        (m) => m.submissionsRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'prioritization',
    loadChildren: () =>
      import('./features/prioritization/prioritization.routes').then(
        (m) => m.prioritizationRoutes
      ),
    canActivate: [authGuard, roleGuard(['developer', 'admin'])],
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        (m) => m.dashboardRoutes
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
