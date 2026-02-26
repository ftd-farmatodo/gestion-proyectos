import { Routes } from '@angular/router';
import { authGuard, departmentSetupGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/auth.guard';

const fullSetup = [authGuard, departmentSetupGuard];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'team-setup',
    loadComponent: () =>
      import('./core/auth/team-setup/team-setup.component').then(
        (m) => m.TeamSetupComponent
      ),
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'department-setup',
    loadComponent: () =>
      import('./core/auth/department-setup/department-setup.component').then(
        (m) => m.DepartmentSetupComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'submissions',
    loadChildren: () =>
      import('./features/submissions/submissions.routes').then(
        (m) => m.submissionsRoutes
      ),
    canActivate: fullSetup,
  },
  {
    path: 'prioritization',
    loadChildren: () =>
      import('./features/prioritization/prioritization.routes').then(
        (m) => m.prioritizationRoutes
      ),
    canActivate: [...fullSetup, roleGuard(['developer', 'admin'])],
  },
  {
    path: 'backlog',
    loadChildren: () =>
      import('./features/backlog/backlog.routes').then(
        (m) => m.backlogRoutes
      ),
    canActivate: [...fullSetup, roleGuard(['developer', 'admin'])],
  },
  {
    path: 'tracking',
    loadChildren: () =>
      import('./features/tracking/tracking.routes').then(
        (m) => m.trackingRoutes
      ),
    canActivate: [...fullSetup, roleGuard(['developer', 'admin'])],
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        (m) => m.dashboardRoutes
      ),
    canActivate: fullSetup,
  },
  {
    path: 'history',
    loadChildren: () =>
      import('./features/history/history.routes').then(
        (m) => m.HISTORY_ROUTES
      ),
    canActivate: fullSetup,
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.routes').then(
        (m) => m.settingsRoutes
      ),
    canActivate: [...fullSetup, roleGuard(['admin'])],
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
