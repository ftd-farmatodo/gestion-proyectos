import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
  },
];
