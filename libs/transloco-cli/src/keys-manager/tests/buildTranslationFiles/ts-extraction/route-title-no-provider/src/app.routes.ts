import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'design-system',
    loadComponent: () => import('./design-system.page'),
    // Must NOT be extracted: `provideTranslocoTitleStrategy` is never
    // imported anywhere in this project (see app.config.ts).
    title: 'app.menu.design_system',
  },
];
