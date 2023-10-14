import { Route } from '@angular/router';

import {
  provideTranslocoLoadingTpl,
  provideTranslocoScopes,
} from '@ngneat/transloco';

export const LAZY_ROUTES: Route = {
  path: 'lazy',
  loadComponent: () =>
    import('./lazy.component').then((LazyComponent) => LazyComponent),
  providers: [
    provideTranslocoScopes('admin-page'),
    provideTranslocoLoadingTpl(
      `<span id="default-loading-template">Loading template...</span>`
    ),
  ],
};
