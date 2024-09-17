import { Route } from '@angular/router';

import { provideTranslocoLoadingTpl } from '@jsverse/transloco';

export const LAZY_MULTIPLE_SCOPES_ROUTES: Route = {
  path: 'lazy-multiple-scopes',
  loadComponent: () =>
    import('./lazy-multiple-scopes.component').then(
      (LazyMultipleScopesComponent) => LazyMultipleScopesComponent,
    ),
  providers: [
    provideTranslocoLoadingTpl(
      `<span id="default-loading-template">Loading template...</span>`,
    ),
  ],
};
