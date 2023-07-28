import { Route } from '@angular/router';

export const MULTI_LANGS_ROUTES: Route = {
  path: 'multi-langs',
  loadComponent: () =>
    import('./multi-langs.component').then(
      (MultilangsComponent) => MultilangsComponent
    ),
};
