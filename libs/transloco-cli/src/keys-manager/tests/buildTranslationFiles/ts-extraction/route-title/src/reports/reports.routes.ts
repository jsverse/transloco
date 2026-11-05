import { Routes } from '@angular/router';

// Lazily loaded via `loadChildren` from ../app.routes.ts - its own route
// titles must be extracted the same way as titles declared directly in the
// root router file, since this file also gets scanned independently.
export const routes: Routes = [
  {
    path: 'summary',
    loadComponent: () => import('./summary.page'),
    title: 'app.menu.reports_summary',
  },
];
