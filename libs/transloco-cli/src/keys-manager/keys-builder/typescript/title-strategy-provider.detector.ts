import ts, { SourceFile } from 'typescript';

import { hasDescendant } from '../../utils/ts-ast.utils';

const titleStrategyMention = /\b(?:provide)?TranslocoTitleStrategy\b/;

const routerModule = '@jsverse/transloco/router';
const titleStrategyIdentifiers = new Set([
  'provideTranslocoTitleStrategy',
  'TranslocoTitleStrategy',
]);

/**
 * Cheap text pre-filter: most files never mention the title strategy, so only
 * those that do need their AST checked with
 * {@link importsTitleStrategyProvider}.
 */
export function mentionsTitleStrategyProvider(content: string): boolean {
  return titleStrategyMention.test(content);
}

/**
 * Whether the file loads `@jsverse/transloco/router` (a static import or a
 * dynamic `import()`) and references
 * `provideTranslocoTitleStrategy` (or `TranslocoTitleStrategy`, for manual
 * `useClass` registration) as code: a named or aliased import, a member of a
 * namespace import, or a destructured / accessed member of a dynamic import. Comments and strings don't count.
 *
 * Importing it anywhere in the project is enough to assume the title strategy
 * is in use: it's typically provided once (e.g. in `app.config.ts`), far from
 * the route files declaring `title` keys, and we don't try to tell an unused
 * import from an applied provider.
 */
export function importsTitleStrategyProvider(ast: SourceFile): boolean {
  return (
    hasDescendant(
      ast,
      (node) => ts.isStringLiteral(node) && node.text === routerModule,
    ) &&
    hasDescendant(
      ast,
      (node) =>
        ts.isIdentifier(node) && titleStrategyIdentifiers.has(node.text),
    )
  );
}
