import { Routes } from '@angular/router';

export const trackingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./weekly-timeline/weekly-timeline.component').then(
        (m) => m.WeeklyTimelineComponent
      ),
  },
];
