import { Routes } from '@angular/router';

export const backlogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./backlog-view/backlog-view.component').then(
        (m) => m.BacklogViewComponent
      ),
  },
];
