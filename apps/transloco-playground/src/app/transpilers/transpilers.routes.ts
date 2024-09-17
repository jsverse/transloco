import { Route } from '@angular/router';

export const TRANSPILERS_ROUTES: Route = {
  path: 'transpilers',
  loadComponent: () =>
    import('./transpilers.component').then(
      (TranspilersComponent) => TranspilersComponent,
    ),
};
