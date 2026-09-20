import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-keys-manager';
const SUBPATH = `${PACKAGE}/marker`;

/** An `import`/`require`/`import()` of the bare package root, in any quote style. */
const ROOT_SPECIFIER = /(['"`])@jsverse\/transloco-keys-manager\1/;

/** Extensions carrying an `import` this migration can rewrite. */
const SCANNED = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'];

interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface MarkerImportResult {
  content: string;
  migrated: number;
}

/**
 * Rewrites `import { marker } from '@jsverse/transloco-keys-manager'` to
 * import from the `/marker` subpath instead.
 *
 * v9 dropped `marker` from the package's top-level export: it is the only
 * export that ever reaches an application bundle, and it now ships solely
 * from `./marker`, ESM-only, to avoid the CommonJS interop bailout bundlers
 * otherwise hit.
 *
 * Positions come from the AST so aliases, mixed named imports and quote style
 * all survive - only the touched import is rewritten, byte for byte, and the
 * rest of the file is left untouched (re-printing would reformat it).
 */
export function migrateMarkerImportSource(
  source: string,
): MarkerImportResult | null {
  const ts = loadTypeScript();
  if (!ts) return null;

  const file = ts.createSourceFile(
    'marker-import.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const edits: Edit[] = [];
  let migrated = 0;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== PACKAGE
    )
      continue;

    const clause = statement.importClause;
    // A default/namespace-only clause has no `marker` binding to move. Type-only
    // imports are migrated too: the package root is gone in v9, so even an
    // erased `import type` no longer resolves for the type checker.
    if (!clause || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    const elements = clause.namedBindings.elements;
    const markerElement = elements.find(
      (element) => (element.propertyName ?? element.name).text === 'marker',
    );
    if (!markerElement) continue;

    migrated++;

    const quote = source[statement.moduleSpecifier.getStart()];
    // The element's own text keeps an alias and an inline `type` modifier.
    const importedName = markerElement.getText();
    const importKeyword = clause.isTypeOnly ? 'import type' : 'import';
    const remaining = elements.filter((element) => element !== markerElement);

    if (remaining.length === 0) {
      // `marker` was the only named import - just repoint the specifier.
      edits.push({
        start: statement.moduleSpecifier.getStart(),
        end: statement.moduleSpecifier.getEnd(),
        text: `${quote}${SUBPATH}${quote}`,
      });
      continue;
    }

    // Other specifiers stay on the root import: drop `marker` from that list
    // and add a second import statement for it right after. The root entry no
    // longer exists in v9, so `migrateMarkerImport` reports what's left.
    edits.push({
      start: clause.namedBindings.getStart(),
      end: clause.namedBindings.getEnd(),
      text: `{ ${remaining.map((element) => element.getText()).join(', ')} }`,
    });
    edits.push({
      start: statement.getEnd(),
      end: statement.getEnd(),
      text: `\n${importKeyword} { ${importedName} } from ${quote}${SUBPATH}${quote};`,
    });
  }

  if (!migrated) return null;

  let content = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  }

  return { content, migrated };
}

/** Whether `source` still references the package root, which v9 removed. */
export function referencesPackageRoot(source: string): boolean {
  return ROOT_SPECIFIER.test(source);
}

/**
 * Walks the tree rewriting `marker` imports in place, and reports whatever is
 * left pointing at the package root.
 *
 * Every `marker` import is repointed, whatever the file extension: `/marker`
 * publishes as `marker.mjs`, so v9 expects ESM consumers. A `require()` of the
 * root isn't an import and stays put, which lands it in the warning below.
 *
 * v9 also removed the package root along with its only other export, the
 * webpack plugin. Anything still pointing at the root after the rewrite -
 * a plugin import, a `webpack-dev.config.js` requiring it - has no automatic
 * replacement, so those files are reported instead of edited.
 */
export function migrateMarkerImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
    const rootReferences: string[] = [];

    for (const path of collectFiles(tree, '', SCANNED)) {
      let source = tree.read(path)?.toString();
      if (!source || !source.includes(PACKAGE)) continue;

      const result = migrateMarkerImportSource(source);
      if (result) {
        tree.overwrite(path, result.content);
        migrated += result.migrated;
        source = result.content;
      }

      if (referencesPackageRoot(source)) rootReferences.push(path);
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Repointed ${migrated} marker import(s) to '${SUBPATH}'.`,
      );
    } else {
      context.logger.info('  ↳ No top-level marker imports found.');
    }

    if (rootReferences.length) {
      context.logger.warn(
        `  ↳ '${PACKAGE}' no longer has a root entry point, but these files still reference it:\n` +
          rootReferences.map((path) => `    - ${path}`).join('\n') +
          `\n    Import marker from '${SUBPATH}'. TranslocoExtractKeysWebpackPlugin was removed;` +
          ` run 'transloco-keys-manager extract' instead.`,
      );
    }
  };
}
