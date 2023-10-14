import { Route } from '@angular/router';

import {
  provideTranslocoLoadingTpl,
  provideTranslocoScopes,
} from '@ngneat/transloco';

export const SCOPE_SHARING_ROUTES: Route = {
  path: 'scope-sharing',
  loadComponent: () =>
    import('./scope-sharing.component').then(
      (ScopeSharingComponent) => ScopeSharingComponent
    ),
  providers: [
    provideTranslocoScopes({
      scope: 'todos-page',
      alias: 'todos',
    }),
    provideTranslocoLoadingTpl(
      `<span id="default-loading-template">Loading template...</span>`
    ),
  ],
};
