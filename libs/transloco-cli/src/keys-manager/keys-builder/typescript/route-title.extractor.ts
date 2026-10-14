import ts, { SourceFile } from 'typescript';

import { Scopes } from '../../types';
import { findDescendants } from '../../utils/ts-ast.utils';
import { resolveAliasAndKey } from '../utils/resolvers.utils';

import { TSExtractorResult } from './types';

const LOCATOR_PROPERTIES = new Set(['path', 'matcher']);
const SHAPER_PROPERTIES = new Set([
  'component',
  'loadComponent',
  'loadChildren',
  'children',
  'redirectTo',
]);

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
 * 1. It must be a *direct* property of an object literal that both
 *    *locates* the route (`path` or a custom `matcher`) and *shapes* it
 *    (`component`, `loadComponent`, `loadChildren`, `children`, or
 *    `redirectTo`) — also as direct properties of that same object. These
 *    two signals together only ever appear on a `Route` object, and
 *    restricting all three to direct properties (rather than descendants at
 *    any depth) keeps a nested/child route's own `path`/`component`/`title`
 *    from being misread as belonging to its parent object, e.g. a
 *    `{ children: [{ path, component, title }] }` wrapper that isn't itself
 *    a `Route`. Property names are resolved whether declared as an
 *    identifier (`path: ...`), a quoted string (`'path': ...`), or a
 *    shorthand property (`{ path }`, short for `{ path: path }`) — though
 *    `title` itself must still be a regular (non-shorthand) property, since
 *    a shorthand property can't carry a literal value to extract.
 * 2. `title` itself must be a non-empty plain string or no-substitution
 *    template literal — not a `ResolveFn` (a function/arrow expression) and
 *    not an already-`marker()`-wrapped call. Both are left untouched: a
 *    `ResolveFn` isn't a static key, and a `marker()` call is picked up by
 *    `markerExtractor` instead, so there's no double-extraction/conflict
 *    when a developer explicitly wraps a route title in `marker()`.
 *
 * A key prefixed with a known scope alias is extracted into that scope's
 * translation file, mirroring how `{{ 'admin.title' | transloco }}` is
 * resolved in templates (see `resolveAliasAndKey`). This matches the runtime,
 * where `TranslocoTitleStrategy` translates the fully-qualified key.
 *
 * @example
 * // Extracted as a global-scope key:
 * { path: 'design-system', component: DesignSystemPage, title: 'app.menu.design_system' }
 *
 * @example
 * // Extracted as the `title` key of the `admin` scope:
 * { path: 'admin', loadChildren: () => import('./admin.routes'), title: 'admin.title' }
 */
export function routeTitleExtractor(
  ast: SourceFile,
  scopes: Scopes,
): TSExtractorResult {
  const result: TSExtractorResult = [];
  const objectLiterals = findDescendants(ast, ts.isObjectLiteralExpression);

  for (const node of objectLiterals) {
    if (!ts.isObjectLiteralExpression(node)) continue;

    let hasLocator = false;
    let hasShaper = false;
    let titleProperty: ts.PropertyAssignment | undefined;

    for (const property of node.properties) {
      if (ts.isShorthandPropertyAssignment(property)) {
        const name = property.name.text;
        if (LOCATOR_PROPERTIES.has(name)) hasLocator = true;
        if (SHAPER_PROPERTIES.has(name)) hasShaper = true;
        continue;
      }

      if (!ts.isPropertyAssignment(property)) continue;

      const name = resolvePropertyName(property.name);
      if (name === undefined) continue;

      if (LOCATOR_PROPERTIES.has(name)) hasLocator = true;
      if (SHAPER_PROPERTIES.has(name)) hasShaper = true;
      if (name === 'title') titleProperty = property;
    }

    if (!hasLocator || !hasShaper || !titleProperty) continue;

    const { initializer } = titleProperty;
    const isPlainStringTitle =
      ts.isStringLiteral(initializer) ||
      ts.isNoSubstitutionTemplateLiteral(initializer);

    if (isPlainStringTitle && initializer.text.length > 0) {
      const [key, scopeAlias] = resolveAliasAndKey(initializer.text, scopes);

      result.push({
        key,
        lang: scopeAlias ? scopes.aliasToScope[scopeAlias] : '',
        params: [],
      });
    }
  }

  return result;
}

/** Resolves a property's name whether it's declared as an identifier
 * (`path: ...`) or a quoted string/no-substitution template literal
 * (`'path': ...`). Returns `undefined` for computed or numeric names, which
 * are never valid route locator/shaper/title property names. */
function resolvePropertyName(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }

  return undefined;
}
