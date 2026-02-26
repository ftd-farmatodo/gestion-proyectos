import type { Routes } from '@angular/router';

export const HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./history-layout/history-layout.component').then(
        (m) => m.HistoryLayoutComponent
      ),
  },
];
