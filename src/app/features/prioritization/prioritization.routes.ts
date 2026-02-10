import { Routes } from '@angular/router';

export const prioritizationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./matrix/matrix.component').then((m) => m.MatrixComponent),
  },
];
