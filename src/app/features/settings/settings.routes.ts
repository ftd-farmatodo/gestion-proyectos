import type { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings-layout/settings-layout.component').then(
        (m) => m.SettingsLayoutComponent
      ),
  },
];
