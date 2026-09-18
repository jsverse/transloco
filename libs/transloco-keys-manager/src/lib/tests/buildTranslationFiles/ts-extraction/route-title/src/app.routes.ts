import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'design-system',
    loadComponent: () => import('./design-system.page'),
    title: 'app.menu.design_system',
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings.page'),
    title: 'app.menu.settings',
    data: { breadcrumb: 'app.menu.settings' },
  },
  {
    path: 'home',
    loadComponent: () => import('./home.page'),
    // Not a plain string - a ResolveFn; left alone since it isn't a static key.
    title: () => 'computed at runtime',
  },
];
