import { Route } from '@angular/router';

import {
  provideTranslocoLoadingTpl,
  TRANSLOCO_LOADING_TEMPLATE,
} from '@ngneat/transloco';

export const LAZY_SCOPE_ALIAS_ROUTES: Route = {
  path: 'lazy-scope-alias',
  loadComponent: () =>
    import('./lazy-scope-alias.component').then(
      (LazyScopeAliasComponent) => LazyScopeAliasComponent
    ),
  providers: [
    provideTranslocoLoadingTpl(
      `<span id="default-loading-template">Loading template...</span>`
    ),
  ],
};
