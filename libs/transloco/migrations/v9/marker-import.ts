import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import {
  applyEdits,
  Edit,
  importsUnaliased,
  lineEndingAround,
  namedImports,
  replaceImport,
  SCANNED_WITH_JSX,
} from './import-utils';
import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

type TypeScript = typeof import('typescript');
type ImportDeclaration = import('typescript').ImportDeclaration;
type ImportSpecifier = import('typescript').ImportSpecifier;
type NamedImports = import('typescript').NamedImports;
type SourceFile = import('typescript').SourceFile;

const PACKAGE = '@jsverse/transloco-keys-manager';
const OLD_SUBPATH = `${PACKAGE}/marker`;

/** Where `marker` lives as of v9. */
const TARGET = '@jsverse/transloco';
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
}

/**
 * The first value import of named bindings from `@jsverse/transloco`, which
 * the moved `marker` joins rather than getting an import of its own. An
 * `import type` can't take a value, so it doesn't count.
 */
function findTargetImport(
  ts: TypeScript,
  file: SourceFile,
): ImportDeclaration | undefined {
  return file.statements.find(
    (statement): statement is ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === TARGET &&
      !!statement.importClause &&
      !statement.importClause.isTypeOnly &&
      !statement.importClause.name &&
      !!statement.importClause.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.length > 0,
  );
}

/**
 * The edit that adds `names` after the last name of `statement`. In braces
 * that hold one name per line, each goes on its own line at the same indent;
 * a trailing comma stays last.
 */
function appendToImport(
  source: string,
  statement: ImportDeclaration,
  names: string[],
): Edit {
  const bindings = statement.importClause?.namedBindings as NamedImports;
  const elements = bindings.elements;
  const last = elements[elements.length - 1];
  const end = last.getEnd();

  const lineStart = source.lastIndexOf('\n', last.getStart() - 1) + 1;
  const indent = source.slice(lineStart, last.getStart());
  const multiline =
    source.slice(bindings.getStart(), elements[0].getStart()).includes('\n') &&
    /^\s*$/.test(indent);

  const separator = multiline
    ? `,${lineEndingAround(source, statement.getStart(), statement.getEnd())}${indent}`
    : ', ';

  return {
    start: end,
    end,
    text: names.map((name) => `${separator}${name}`).join(''),
  };
}

/**
 * Rewrites `import { marker } from '@jsverse/transloco-keys-manager'` and
 * `import { marker } from '@jsverse/transloco-keys-manager/marker'` to import
 * it from `@jsverse/transloco` instead.
 *
 * `marker` is the only export of the keys manager that ever reaches an
 * application bundle. v9 exports it from the core package, which every
 * application already depends on, and removes both old paths.
 *
 * When the file already has a value import from `@jsverse/transloco`, `marker`
 * joins it; otherwise it gets an import of its own. Positions come from the
 * AST so aliases, a `type` modifier, mixed named imports, the quote style and
 * the semicolon all survive - only the touched imports are rewritten, byte for
 * byte, and the rest of the file is left untouched (re-printing would reformat
 * it), line endings and BOM included.
 *
 * Other names stay on an import of the old path. A name the file already
 * imports, unaliased, from the core package is not imported a second time: it
 * only leaves the old import, which goes with it when nothing else is on it.
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
  // A type-only import of `marker` doesn't cover a value import being moved.
  let markerValueImported = importsUnaliased(ts, file, TARGET, EXPORT, true);

  const target = findTargetImport(ts, file);
  // What joins `target`, collected so that it takes a single edit.
  const joining: string[] = [];

  const edits: Edit[] = [];
  let migrated = 0;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !SOURCES.includes(statement.moduleSpecifier.text)
    )
      continue;

    const clause = statement.importClause;
    // A default/namespace clause has no `marker` binding to move. Type-only
    // imports are migrated too: both old paths are gone in v9, so even an
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
    const isTypeOnly = (element: ImportSpecifier) =>
      clause.isTypeOnly || element.isTypeOnly;
    const toAdd = moved.filter(
      (element) =>
        element.propertyName ||
        !(isTypeOnly(element) ? markerImported : markerValueImported),
    );
    for (const element of toAdd) {
      if (element.propertyName) continue;

      markerImported = true;
      markerValueImported ||= !isTypeOnly(element);
    }

    const specifier = statement.moduleSpecifier;
    const quote = source[specifier.getStart()];
    const semicolon = statement.getText().endsWith(';') ? ';' : '';
    const keyword = clause.isTypeOnly ? 'import type' : 'import';
    const from = (specifier: string) =>
      `from ${quote}${specifier}${quote}${semicolon}`;
    const original = bindings.getText();

    // Other names stay on the old path: it is gone in v9, and
    // `migrateMarkerImport` reports what is left on it.
    const statements: string[] = [];
    if (kept.length) {
      statements.push(
        `${keyword} ${namedImports(kept, elements, original, false)} ${from(specifier.text)}`,
      );
    }

    if (target) {
      // In a value import, a name of an `import type` needs its own modifier.
      joining.push(
        ...toAdd.map((element) =>
          clause.isTypeOnly ? `type ${element.getText()}` : element.getText(),
        ),
      );
      edits.push(replaceImport(source, statement, statements));
      continue;
    }

    if (!kept.length && toAdd.length === moved.length) {
      // `marker` was all there is - just repoint the specifier.
      edits.push({
        start: specifier.getStart(),
        end: specifier.getEnd(),
        text: `${quote}${TARGET}${quote}`,
      });
      continue;
    }

    if (toAdd.length) {
      statements.push(
        `${keyword} ${namedImports(toAdd, elements, original, false)} ${from(TARGET)}`,
      );
    }

    edits.push(replaceImport(source, statement, statements));
  }

  if (!migrated) return null;

  if (target && joining.length) {
    edits.push(appendToImport(source, target, joining));
  }

  return { content: applyEdits(source, edits), migrated };
}

/** Whether `source` still references the package root, which v9 removed. */
export function referencesPackageRoot(source: string): boolean {
  return ROOT_SPECIFIER.test(source);
}

/** Whether `source` still references the old `/marker` subpath, which v9 removed. */
export function referencesOldSubpath(source: string): boolean {
  return OLD_SUBPATH_SPECIFIER.test(source);
}

/**
 * Walks the tree rewriting `marker` imports in place, and reports whatever is
 * left pointing at the old paths.
 *
 * Every `marker` import is repointed, whatever the file extension. A
 * `require()`, an `import()`, a default or namespace import and a re-export
 * aren't imports of the name, so they stay put, which lands them in the
 * warnings below.
 *
 * v9 also removed the package root along with its only other export, the
 * webpack plugin. Anything still pointing at the root after the rewrite -
 * a plugin import, a `webpack-dev.config.js` requiring it - has no automatic
 * replacement, so those files are reported instead of edited.
 *
 * The workspace already depends on `@jsverse/transloco`, so no dependency is
 * added.
 */
export function migrateMarkerImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
    const rootReferences: string[] = [];
    const subpathReferences: string[] = [];

    for (const path of collectFiles(tree, '', SCANNED_WITH_JSX)) {
      let source = tree.read(path)?.toString();
      if (!source || !source.includes(PACKAGE)) continue;

      const result = migrateMarkerImportSource(source, path);
      if (result) {
        tree.overwrite(path, result.content);
        migrated += result.migrated;
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
        `  ↳ '${OLD_SUBPATH}' was removed, and these files still use it in a way this migration cannot rewrite:\n` +
          subpathReferences.map((path) => `    - ${path}`).join('\n') +
          `\n    Import { marker } from '${TARGET}' instead.`,
      );
    }
  };
}
