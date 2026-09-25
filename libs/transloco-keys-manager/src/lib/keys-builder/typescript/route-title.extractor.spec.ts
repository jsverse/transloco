import { describe, expect, it } from 'vitest';

import { Scopes } from '../../types';
import { parseTsSource } from '../../utils/ts-ast.utils';

import { routeTitleExtractor } from './route-title.extractor';

const noScopes: Scopes = { scopeToAlias: {}, aliasToScope: {} };
const adminScopes: Scopes = {
  scopeToAlias: { admin: 'admin' },
  aliasToScope: { admin: 'admin' },
};

function parse(content: string) {
  return parseTsSource(content);
}

describe('routeTitleExtractor', () => {
  it(`GIVEN a Route object with a plain-string title
      WHEN the route titles are extracted
      THEN the title is extracted as a global key`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'design-system',
          loadComponent: () => import('./design-system.page'),
          title: 'app.menu.design_system',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'app.menu.design_system', lang: '', params: [] },
    ]);
  });

  it(`GIVEN a Route whose path, component and title property names are quoted strings
      WHEN the route titles are extracted
      THEN the title is extracted`, () => {
    const ast = parse(`
      export const routes = [
        {
          'path': 'quoted-keys',
          'loadComponent': () => import('./quoted-keys.page'),
          'title': 'app.menu.quoted_keys',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'app.menu.quoted_keys', lang: '', params: [] },
    ]);
  });

  it(`GIVEN a parent object with a title that only qualifies as a Route through a nested child route
      WHEN the route titles are extracted
      THEN only the child route title is extracted`, () => {
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

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'app.menu.nested', lang: '', params: [] },
    ]);
  });

  it(`GIVEN an object that shares path and title with a Route but has no shaper property
      WHEN the route titles are extracted
      THEN nothing is extracted`, () => {
    const ast = parse(`
      export const breadcrumbConfig = {
        path: 'design-system',
        title: 'not.a.route.title.key',
      };
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([]);
  });

  it(`GIVEN a Route whose title is a ResolveFn
      WHEN the route titles are extracted
      THEN nothing is extracted`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'home',
          loadComponent: () => import('./home.page'),
          title: () => 'computed at runtime',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([]);
  });

  it(`GIVEN a Route with an empty-string title
      WHEN the route titles are extracted
      THEN nothing is extracted`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'empty-title',
          loadComponent: () => import('./empty-title.page'),
          title: '',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([]);
  });

  it(`GIVEN a Route shaped via loadChildren
      WHEN the route titles are extracted
      THEN its plain-string title is extracted`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'reports',
          loadChildren: () => import('./reports/reports.routes').then((m) => m.routes),
          title: 'app.menu.reports',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'app.menu.reports', lang: '', params: [] },
    ]);
  });

  it(`GIVEN a Route whose locator or shaper is a shorthand property (e.g. { path })
      WHEN the route titles are extracted
      THEN its title is extracted`, () => {
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

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'app.menu.shorthand', lang: '', params: [] },
    ]);
  });

  it(`GIVEN a Route whose title is wrapped in marker()
      WHEN the route titles are extracted
      THEN nothing is extracted, as markerExtractor handles it`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'admin',
          loadComponent: () => import('./admin/admin.page'),
          title: marker('title', undefined, 'admin'),
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([]);
  });

  it(`GIVEN a Route title prefixed with a known scope alias
      WHEN the route titles are extracted
      THEN the key is extracted into that scope`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'admin',
          loadChildren: () => import('./admin.routes'),
          title: 'admin.title',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, adminScopes)).toEqual([
      { key: 'title', lang: 'admin', params: [] },
    ]);
  });

  it(`GIVEN a Route title with a dotted key whose prefix is not a known scope alias
      WHEN the route titles are extracted
      THEN the key stays global`, () => {
    const ast = parse(`
      export const routes = [
        {
          path: 'admin',
          loadChildren: () => import('./admin.routes'),
          title: 'admin.title',
        },
      ];
    `);

    expect(routeTitleExtractor(ast, noScopes)).toEqual([
      { key: 'admin.title', lang: '', params: [] },
    ]);
  });
});
