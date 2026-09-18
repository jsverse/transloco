import { tsquery, ScriptKind } from '@phenomnomnominal/tsquery';
import { describe, expect, it } from 'vitest';

import { routeTitleExtractor } from './route-title.extractor';

function parse(content: string) {
  return tsquery.ast(content, undefined, ScriptKind.TS);
}

describe('routeTitleExtractor', () => {
  it('extracts a plain-string title from a Route object', () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'design-system',
          loadComponent: () => import('./design-system.page'),
          title: 'app.menu.design_system',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([
      { key: 'app.menu.design_system', lang: '', params: [] },
    ]);
  });

  it('resolves locator/shaper/title property names declared as quoted strings, not just identifiers', () => {
    const ast = parse(`
      export const routes = [
        {
          'path': 'quoted-keys',
          'loadComponent': () => import('./quoted-keys.page'),
          'title': 'app.menu.quoted_keys',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([
      { key: 'app.menu.quoted_keys', lang: '', params: [] },
    ]);
  });

  it('does not extract a parent object title that only qualifies via a nested/descendant child route', () => {
    const ast = parse(`
      export const routes = [
        {
          // No own path/matcher - only "shapes" a route via children.
          children: [
            {
              path: 'nested',
              component: NestedComponent,
              title: 'app.menu.nested',
            },
          ],
          title: 'not.a.route.title.either',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([
      { key: 'app.menu.nested', lang: '', params: [] },
    ]);
  });

  it('does not extract from an object that merely shares path+title with a Route (no shaper property)', () => {
    const ast = parse(`
      export const breadcrumbConfig = {
        path: 'design-system',
        title: 'not.a.route.title.key',
      };
    `);

    expect(routeTitleExtractor(ast)).toEqual([]);
  });

  it('does not extract a ResolveFn title', () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'home',
          loadComponent: () => import('./home.page'),
          title: () => 'computed at runtime',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([]);
  });

  it('does not extract an empty-string title', () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'empty-title',
          loadComponent: () => import('./empty-title.page'),
          title: '',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([]);
  });

  it('extracts a plain-string title on a route shaped via loadChildren (lazy-loaded child routes)', () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'reports',
          loadChildren: () => import('./reports/reports.routes').then((m) => m.routes),
          title: 'app.menu.reports',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([
      { key: 'app.menu.reports', lang: '', params: [] },
    ]);
  });

  it('resolves a locator/shaper declared as a shorthand property (e.g. `{ path }`)', () => {
    const ast = parse(`
      const path = 'shorthand';
      const component = ShorthandComponent;
      export const routes = [
        {
          path,
          component,
          title: 'app.menu.shorthand',
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([
      { key: 'app.menu.shorthand', lang: '', params: [] },
    ]);
  });

  it('does not extract a marker()-wrapped title (left to markerExtractor)', () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'admin',
          loadComponent: () => import('./admin/admin.page'),
          title: marker('title', undefined, 'admin'),
        },
      ];
    `);

    expect(routeTitleExtractor(ast)).toEqual([]);
  });
});
