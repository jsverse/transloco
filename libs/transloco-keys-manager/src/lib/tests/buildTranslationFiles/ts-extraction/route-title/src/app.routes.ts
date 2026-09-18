import { Routes, UrlMatcher } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';

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
    // Wrapped in marker() with a 3rd (scope) argument, since a scoped/lazy
    // title key can't be a plain string - the bare-string route-title
    // extractor must not also pick this up: its `title` initializer is a
    // CallExpression, not a string literal, so only `markerExtractor`
    // extracts it (into the `admin` scope), with no duplication/conflict
    // between the two.
    title: marker('title', undefined, 'admin'),
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
];

// Not a Route: shares `path`/`title` with a Route but has none of the
// route-shaping properties (component/loadComponent/loadChildren/children/
// redirectTo), so it must NOT be treated as a route title key.
export const breadcrumbConfig = {
  path: 'design-system',
  title: 'not.a.route.title.key',
};
