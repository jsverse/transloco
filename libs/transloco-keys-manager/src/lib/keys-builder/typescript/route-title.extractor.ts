import ts, { SourceFile } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import { TSExtractorResult } from './types';

/**
 * Extracts translation keys from a `Route`'s `title` property, without
 * requiring the `marker`/`_()` wrapping other plain strings need.
 *
 * This only runs when the project uses `provideTranslocoTitleStrategy()`
 * (checked once, project-wide, by the caller): in that case
 * `TranslocoTitleStrategy` treats every resolved route title as a
 * translation key, so a plain string used as `title` *is* a key on its own.
 *
 * How it decides a `title` is a route title key:
 * 1. It must sit in an object literal that both *locates* the route
 *    (`path` or a custom `matcher`) and *shapes* it (`component`,
 *    `loadComponent`, `loadChildren`, `children`, or `redirectTo`). These two
 *    signals together only ever appear on a `Route` object, which keeps
 *    this from matching unrelated `{ path, title }`-shaped data, e.g. a
 *    breadcrumb/nav-menu config.
 * 2. `title` itself must be a non-empty plain string or no-substitution
 *    template literal — not a `ResolveFn` (a function/arrow expression) and
 *    not an already-`marker()`-wrapped call. Both are left untouched: a
 *    `ResolveFn` isn't a static key, and a `marker()` call is picked up by
 *    `markerExtractor` instead, so there's no double-extraction/conflict
 *    when a developer explicitly wraps a route title in `marker()` (e.g. to
 *    route it into a scoped translation file via its 3rd argument).
 *
 * @example
 * // Extracted as a global-scope key, no `marker`/`_()` needed:
 * { path: 'design-system', component: DesignSystemPage, title: 'app.menu.design_system' }
 *
 * @example
 * // Left to `markerExtractor` (needed to target the `admin` scope):
 * { path: 'admin', loadChildren: () => import('./admin.routes'), title: marker('title', undefined, 'admin') }
 */
export function routeTitleExtractor(ast: SourceFile): TSExtractorResult {
  const locatesRoute = ['path', 'matcher']
    .map((name) => `PropertyAssignment > Identifier[name=${name}]`)
    .join(', ');
  const shapesRoute = [
    'component',
    'loadComponent',
    'loadChildren',
    'children',
    'redirectTo',
  ]
    .map((name) => `PropertyAssignment > Identifier[name=${name}]`)
    .join(', ');

  const titleIdentifiers = tsquery(
    ast,
    `ObjectLiteralExpression:has(${locatesRoute}):has(${shapesRoute}) > PropertyAssignment > Identifier[name=title]`,
  );

  const result: TSExtractorResult = [];

  for (const titleIdentifier of titleIdentifiers) {
    const property = titleIdentifier.parent;
    if (!ts.isPropertyAssignment(property)) continue;

    const { initializer } = property;
    const isPlainStringTitle =
      ts.isStringLiteral(initializer) ||
      ts.isNoSubstitutionTemplateLiteral(initializer);

    if (isPlainStringTitle && initializer.text.length > 0) {
      result.push({ key: initializer.text, lang: '', params: [] });
    }
  }

  return result;
}
