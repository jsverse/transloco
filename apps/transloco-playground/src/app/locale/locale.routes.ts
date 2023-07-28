import { Route } from '@angular/router';

export const LOCALE_ROUTES: Route = {
  path: 'locale',
  loadComponent: () =>
    import('./locale.component').then((LocaleComponent) => LocaleComponent),
};
