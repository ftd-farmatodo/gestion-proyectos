import { Routes } from '@angular/router';

export const submissionsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  {
    path: 'new',
    loadComponent: () =>
      import('./submission-form/submission-form.component').then(
        (m) => m.SubmissionFormComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./my-requests/my-requests.component').then(
        (m) => m.MyRequestsComponent
      ),
  },
];
