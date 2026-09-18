import ts, { SourceFile } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import { TSExtractorResult } from './types';

/**
 * Extracts translation keys from a `Route`'s `title` property.
 *
 * This only runs when the project uses `provideTranslocoTitleStrategy()`
 * (checked once, project-wide, by the caller) — in that case
 * `TranslocoTitleStrategy` treats every resolved route title as a
 * translation key, so a plain string used as `title` *is* a key, without
 * needing the `marker`/`_()` wrapping other plain strings require.
 *
 * Heuristic: an object literal with sibling `path` and `title` properties,
 * where `title` is a plain string (not a `ResolveFn`/already `marker()`-
 * wrapped call, which are left to the other extractors/ignored).
 */
export function routeTitleExtractor(ast: SourceFile): TSExtractorResult {
  const titleIdentifiers = tsquery(
    ast,
    'ObjectLiteralExpression:has(PropertyAssignment > Identifier[name=path]) > PropertyAssignment > Identifier[name=title]',
  );

  const result: TSExtractorResult = [];

  for (const titleIdentifier of titleIdentifiers) {
    const property = titleIdentifier.parent;
    if (!ts.isPropertyAssignment(property)) continue;

    const { initializer } = property;
    if (
      ts.isStringLiteral(initializer) ||
      ts.isNoSubstitutionTemplateLiteral(initializer)
    ) {
      result.push({ key: initializer.text, lang: '', params: [] });
    }
  }

  return result;
}
