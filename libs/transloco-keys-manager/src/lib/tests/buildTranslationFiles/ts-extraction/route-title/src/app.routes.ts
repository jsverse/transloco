import { Routes, UrlMatcher } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

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
  {
    // A custom `matcher` instead of `path` is also a valid route locator.
    matcher: ((): UrlMatcher => null as unknown as UrlMatcher)(),
    redirectTo: 'design-system',
    title: 'app.menu.matched_route',
  },
  {
    path: 'empty-title',
    loadComponent: () => import('./empty-title.page'),
    // An empty string isn't a usable key - should not be extracted.
    title: '',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page'),
    // The scope is declared on the route itself. keys-manager discovers it
    // from `provideTranslocoScope('admin')`, so a title prefixed with that
    // alias (`admin.title`) is extracted into the `admin` scope file, while
    // a title whose prefix is not a declared scope (`app.menu.*`) stays global.
    providers: [provideTranslocoScope('admin')],
    title: 'admin.title',
  },
  {
    // The parent object has neither its own `path`/`matcher` nor a title
    // that should be extracted - it only *shapes* a route via `children`,
    // and its own `title` must not be picked up just because a descendant
    // (the nested route below) happens to have both a locator and a shaper.
    children: [
      {
        path: 'nested',
        component: null,
        title: 'app.menu.nested',
      },
    ],
    title: 'not.a.route.title.either',
  },
  {
    // `loadChildren` (lazy-loaded child routes) is a valid route shaper too.
    path: 'reports',
    loadChildren: () =>
      import('./reports/reports.routes').then((m) => m.routes),
    title: 'app.menu.reports',
  },
];

// Not a Route: shares `path`/`title` with a Route but has none of the
// route-shaping properties (component/loadComponent/loadChildren/children/
// redirectTo), so it must NOT be treated as a route title key.
export const breadcrumbConfig = {
  path: 'design-system',
  title: 'not.a.route.title.key',
};
