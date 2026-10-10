import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import {
  addCliDependency,
  applyEdits,
  Edit,
  importsFromCli,
  importsUnaliased,
  namedImports,
  replaceImport,
  SCANNED_WITH_JSX,
} from './import-utils';
import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-keys-manager';
const OLD_SUBPATH = `${PACKAGE}/marker`;

/** Where `marker` lives as of v9. */
const TARGET = '@jsverse/transloco-cli/marker';
const EXPORT = 'marker';

/** The two paths `marker` used to be imported from. */
const SOURCES = [PACKAGE, OLD_SUBPATH];

/** An `import`/`require`/`import()` of the bare package root, in any quote style. */
const ROOT_SPECIFIER = /(['"`])@jsverse\/transloco-keys-manager\1/;

/** The same for the old `/marker` subpath. */
const OLD_SUBPATH_SPECIFIER =
  /(['"`])@jsverse\/transloco-keys-manager\/marker\1/;

export interface MarkerImportResult {
  content: string;
  /** The imports that had a `marker` to move. */
  migrated: number;
  /** How many of them now import `marker` from the CLI where the file did not before. */
  introduced: number;
}

/**
 * Rewrites `import { marker } from '@jsverse/transloco-keys-manager'` and
 * `import { marker } from '@jsverse/transloco-keys-manager/marker'` to import
 * from `@jsverse/transloco-cli/marker` instead.
 *
 * `marker` is the only export of the keys manager that ever reaches an
 * application bundle. v9 publishes it from the CLI package, which the keys
 * manager became a thin wrapper around; the two old paths keep working but
 * are deprecated, and the package root is gone.
 *
 * Positions come from the AST so aliases, an inline `type` modifier, mixed
 * named imports, the quote style and the semicolon all survive - only the
 * touched import is rewritten, byte for byte, and the rest of the file is left
 * untouched (re-printing would reformat it), line endings and BOM included.
 *
 * Other names stay on an import of the old path. A name the file already
 * imports, unaliased, from the new path is not imported a second time: it only
 * leaves the old import, which goes with it when nothing else is on it.
 */
export function migrateMarkerImportSource(
  source: string,
  fileName = 'marker-import.ts',
): MarkerImportResult | null {
  const ts = loadTypeScript();
  if (!ts) return null;

  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  let markerImported = importsUnaliased(ts, file, TARGET, EXPORT);

  const edits: Edit[] = [];
  let migrated = 0;
  let introduced = 0;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !SOURCES.includes(statement.moduleSpecifier.text)
    )
      continue;

    const clause = statement.importClause;
    // A default/namespace clause has no `marker` binding to move. Type-only
    // imports are migrated too: the package root is gone in v9, so even an
    // erased `import type` no longer resolves for the type checker.
    if (!clause || clause.name || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    const bindings = clause.namedBindings;
    const elements = bindings.elements;
    const moved = elements.filter(
      (element) => (element.propertyName ?? element.name).text === EXPORT,
    );
    if (!moved.length) continue;

    migrated++;

    const kept = elements.filter((element) => !moved.includes(element));
    const toAdd = moved.filter(
      (element) => element.propertyName || !markerImported,
    );
    markerImported ||= toAdd.some((element) => !element.propertyName);
    if (toAdd.length) introduced++;

    const specifier = statement.moduleSpecifier;
    const quote = source[specifier.getStart()];

    if (!kept.length && toAdd.length === moved.length) {
      // `marker` was all there is - just repoint the specifier.
      edits.push({
        start: specifier.getStart(),
        end: specifier.getEnd(),
        text: `${quote}${TARGET}${quote}`,
      });
      continue;
    }

    const semicolon = statement.getText().endsWith(';') ? ';' : '';
    const keyword = clause.isTypeOnly ? 'import type' : 'import';
    const from = (specifier: string) =>
      `from ${quote}${specifier}${quote}${semicolon}`;
    const original = bindings.getText();

    // Other names stay on the old path: the root is gone in v9 and
    // `migrateMarkerImport` reports what is left on it.
    const statements: string[] = [];
    if (kept.length) {
      statements.push(
        `${keyword} ${namedImports(kept, elements, original, false)} ${from(specifier.text)}`,
      );
    }
    if (toAdd.length) {
      statements.push(
        `${keyword} ${namedImports(toAdd, elements, original, false)} ${from(TARGET)}`,
      );
    }

    edits.push(replaceImport(source, statement, statements));
  }

  if (!migrated) return null;

  return { content: applyEdits(source, edits), migrated, introduced };
}

/** Whether `source` still references the package root, which v9 removed. */
export function referencesPackageRoot(source: string): boolean {
  return ROOT_SPECIFIER.test(source);
}

/** Whether `source` still references the old `/marker` subpath. */
export function referencesOldSubpath(source: string): boolean {
  return OLD_SUBPATH_SPECIFIER.test(source);
}

/**
 * Walks the tree rewriting `marker` imports in place, and reports whatever is
 * left pointing at the old paths.
 *
 * Every `marker` import is repointed, whatever the file extension: the new
 * path publishes as an ES module. A `require()`, an `import()`, a default or
 * namespace import and a re-export aren't imports of the name, so they stay
 * put, which lands them in the warnings below.
 *
 * v9 also removed the package root along with its only other export, the
 * webpack plugin. Anything still pointing at the root after the rewrite -
 * a plugin import, a `webpack-dev.config.js` requiring it - has no automatic
 * replacement, so those files are reported instead of edited.
 *
 * When an import of `@jsverse/transloco-cli/marker` was introduced and the
 * workspace doesn't list `@jsverse/transloco-cli`, it is added to
 * `devDependencies`.
 */
export function migrateMarkerImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
    let introduced = 0;
    const rootReferences: string[] = [];
    const subpathReferences: string[] = [];

    for (const path of collectFiles(tree, '', SCANNED_WITH_JSX)) {
      let source = tree.read(path)?.toString();
      if (!source || !source.includes(PACKAGE)) continue;

      const result = migrateMarkerImportSource(source, path);
      if (result) {
        tree.overwrite(path, result.content);
        migrated += result.migrated;
        introduced += result.introduced;
        source = result.content;
      }

      if (referencesPackageRoot(source)) rootReferences.push(path);
      if (referencesOldSubpath(source)) subpathReferences.push(path);
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Repointed ${migrated} marker import(s) to '${TARGET}'.`,
      );
    } else {
      context.logger.info(
        `  ↳ No marker imports from '${PACKAGE}' or '${OLD_SUBPATH}' found.`,
      );
    }

    if (rootReferences.length) {
      context.logger.warn(
        `  ↳ '${PACKAGE}' no longer has a root entry point, but these files still reference it:\n` +
          rootReferences.map((path) => `    - ${path}`).join('\n') +
          `\n    Import marker from '${TARGET}'. TranslocoExtractKeysWebpackPlugin was removed;` +
          ` run 'transloco extract' instead.`,
      );
    }

    if (subpathReferences.length) {
      context.logger.warn(
        `  ↳ '${OLD_SUBPATH}' is deprecated, and these files still use it in a way this migration cannot rewrite:\n` +
          subpathReferences.map((path) => `    - ${path}`).join('\n') +
          `\n    Import { marker } from '${TARGET}' instead.`,
      );
    }

    if (introduced)
      return addCliDependency(tree, context, importsFromCli(EXPORT));
  };
}
