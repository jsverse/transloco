import * as nodeModule from 'node:module';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import {
  addCliDependency,
  applyEdits,
  CLI_PACKAGE,
  Edit,
  importsUnaliased,
  namedImports,
  replaceImport,
  SCANNED_WITH_JSX,
} from './import-utils';
import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-utils';

/** Where the config type lives as of v9. */
const TYPE_PACKAGE = '@jsverse/transloco';
const TYPE_EXPORT = 'TranslocoGlobalConfig';

/** Where the config reader lives as of v9. */
const READER_PACKAGE = CLI_PACKAGE;
const READER_EXPORT = 'getGlobalConfig';

/** The TS files cosmiconfig loads a Transloco config from by default. */
const CONFIG_FILE =
  /(?:^|\/)(?:transloco\.config|\.translocorc|\.config\/translocorc)\.[mc]?ts$/;

const TS_FILE = /\.[mc]?ts$/;

/** An `import('@jsverse/transloco-utils')`, which also appears in JSDoc types. */
const IMPORT_CALL = /import\(\s*(['"`])@jsverse\/transloco-utils\1\s*\)/;

export interface ConfigTypeImportResult {
  content: string;
  /** The specifiers moved off `@jsverse/transloco-utils`. */
  migrated: number;
  /** How many of them are `getGlobalConfig`, now imported from the CLI. */
  readers: number;
}

type ImportSpecifier = import('typescript').ImportSpecifier;

/**
 * Moves the imports of `TranslocoGlobalConfig` and `getGlobalConfig` off
 * `@jsverse/transloco-utils`.
 *
 * v9 exports the type from `@jsverse/transloco` and the reader from
 * `@jsverse/transloco-cli`, and `@jsverse/transloco` no longer installs the
 * utils package. The type always lands in an `import type`: v9 loads TS configs
 * through cosmiconfig 10, which runs them with Node's own type stripping rather
 * than compiling them with TypeScript. Node erases `import type` but keeps a
 * plain import of an interface as a runtime import, which then fails because
 * the package exports no such binding.
 *
 * An import holding both is split in two. Aliases, an inline `type` modifier,
 * the quote style and the semicolon survive; any other name stays on an import
 * of the utils package, and so does a default or namespace import. Only the
 * touched statements are rewritten, so the rest of the file stays as it was,
 * line endings and BOM included.
 *
 * A name the file already imports, unaliased, from its new package is not
 * imported a second time: it only leaves the utils import.
 */
export function migrateConfigTypeImportSource(
  source: string,
  fileName = 'config-type-import.ts',
): ConfigTypeImportResult | null {
  const ts = loadTypeScript();
  if (!ts) return null;

  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  let typeImported = importsUnaliased(ts, file, TYPE_PACKAGE, TYPE_EXPORT);
  let readerImported = importsUnaliased(
    ts,
    file,
    READER_PACKAGE,
    READER_EXPORT,
  );

  const edits: Edit[] = [];
  let types = 0;
  let readers = 0;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== PACKAGE
    )
      continue;

    const clause = statement.importClause;
    // A default or namespace binding has nothing to move, and the named ones
    // next to it stay with it - `migrateConfigTypeImport` reports the file.
    if (!clause || clause.name || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    const bindings = clause.namedBindings;
    const elements = bindings.elements;
    const nameOf = (element: ImportSpecifier) =>
      (element.propertyName ?? element.name).text;

    const typeElements = elements.filter(
      (element) => nameOf(element) === TYPE_EXPORT,
    );
    const readerElements = elements.filter(
      (element) => nameOf(element) === READER_EXPORT,
    );
    if (!typeElements.length && !readerElements.length) continue;

    const kept = elements.filter(
      (element) =>
        !typeElements.includes(element) && !readerElements.includes(element),
    );

    types += typeElements.length;
    readers += readerElements.length;

    const quote = source[statement.moduleSpecifier.getStart()];
    const semicolon = statement.getText().endsWith(';') ? ';' : '';
    const runtimeKeyword = clause.isTypeOnly ? 'import type' : 'import';
    const from = (specifier: string) =>
      `from ${quote}${specifier}${quote}${semicolon}`;
    const original = bindings.getText();

    const typesToAdd = typeElements.filter(
      (element) => element.propertyName || !typeImported,
    );
    const readersToAdd = readerElements.filter(
      (element) => element.propertyName || !readerImported,
    );
    typeImported ||= typesToAdd.some((element) => !element.propertyName);
    readerImported ||= readersToAdd.some((element) => !element.propertyName);

    const statements: string[] = [];
    if (typesToAdd.length) {
      statements.push(
        `import type ${namedImports(typesToAdd, elements, original, true)} ${from(TYPE_PACKAGE)}`,
      );
    }
    if (readersToAdd.length) {
      statements.push(
        `${runtimeKeyword} ${namedImports(readersToAdd, elements, original, false)} ${from(READER_PACKAGE)}`,
      );
    }
    if (kept.length) {
      statements.push(
        `${runtimeKeyword} ${namedImports(kept, elements, original, false)} ${from(PACKAGE)}`,
      );
    }

    edits.push(replaceImport(source, statement, statements));
  }

  if (!edits.length) return null;

  return {
    content: applyEdits(source, edits),
    migrated: types + readers,
    readers,
  };
}

/**
 * Whether `source` still names `@jsverse/transloco-utils` as a module:
 * a default or namespace import, a name that has no new home, a `require()`,
 * an `import()` - a JSDoc type included - or a re-export. Those are left as
 * they are.
 */
export function referencesConfigPackage(
  source: string,
  fileName = 'config-type-import.ts',
): boolean {
  if (!source.includes(PACKAGE)) return false;

  const ts = loadTypeScript();
  // Without the parser nothing was migrated either, so say it was left alone.
  if (!ts) return true;

  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const mentions = (node: import('typescript').Node): boolean =>
    (ts.isStringLiteralLike(node) && node.text === PACKAGE) ||
    (ts.forEachChild(node, (child) => mentions(child) || undefined) ?? false);

  // JSDoc types are not part of the tree the walk above visits.
  return mentions(file) || IMPORT_CALL.test(source);
}

/**
 * Why Node's type stripping rejects `source`, or `null` when it loads fine.
 *
 * Uses the same stripper cosmiconfig 10 ends up running, so `enum`,
 * `namespace` and other syntax that needs compiling are caught exactly as the
 * CLI would hit them. On a Node without it the check is skipped; the version
 * floor report already covers that Node.
 */
export function findStrippingError(source: string): string | null {
  const strip = (
    nodeModule as {
      stripTypeScriptTypes?: (code: string) => string;
    }
  ).stripTypeScriptTypes;
  if (!strip) return null;

  try {
    strip(source);
    return null;
  } catch (error) {
    return (error as Error).message.split('\n')[0];
  }
}

/**
 * Walks the tree moving the config type and reader imports off
 * `@jsverse/transloco-utils`, reports what it could not move, and then reports
 * any Transloco config that can't load under Node's type stripping.
 *
 * Every file importing from the package is scanned, not just the default
 * config names: `--config` accepts any path, and `getGlobalConfig` is called
 * from scripts as well. A file left importing the package - a default or
 * namespace import, a `require()`, a name with no new home - is reported
 * rather than edited.
 *
 * When an import of `@jsverse/transloco-cli` was introduced and the workspace
 * doesn't list that package, it is added to `devDependencies`.
 */
export function migrateConfigTypeImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
    let readers = 0;
    const leftovers: string[] = [];
    const unloadable: string[] = [];

    for (const path of collectFiles(tree, '', SCANNED_WITH_JSX)) {
      const isConfig = CONFIG_FILE.test(path);
      let source = tree.read(path)?.toString();
      if (!source) continue;
      if (!isConfig && !source.includes(PACKAGE)) continue;

      const result = source.includes(PACKAGE)
        ? migrateConfigTypeImportSource(source, path)
        : null;
      if (result) {
        tree.overwrite(path, result.content);
        migrated += result.migrated;
        readers += result.readers;
        source = result.content;
      }

      if (referencesConfigPackage(source, path)) leftovers.push(path);

      if (!TS_FILE.test(path) || (!isConfig && !result)) continue;

      const error = findStrippingError(source);
      if (error) unloadable.push(`    - ${path}: ${error}`);
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Moved ${migrated} import(s) off '${PACKAGE}': ${migrated - readers} ${TYPE_EXPORT} to '${TYPE_PACKAGE}', ${readers} ${READER_EXPORT} to '${READER_PACKAGE}'.`,
      );
    } else {
      context.logger.info(
        `  ↳ No ${TYPE_EXPORT} or ${READER_EXPORT} imports found.`,
      );
    }

    if (leftovers.length) {
      context.logger.warn(
        `  ↳ '${PACKAGE}' is deprecated, and these files still use it in a way this migration cannot rewrite:\n` +
          leftovers.map((path) => `    - ${path}`).join('\n') +
          `\n    Only ${TYPE_EXPORT} (now in '${TYPE_PACKAGE}') and ${READER_EXPORT} (now in '${READER_PACKAGE}') moved.` +
          ` '${TYPE_PACKAGE}' no longer installs the utils package, so add it to your package.json if it isn't listed there and these files stay.`,
      );
    }

    if (unloadable.length) {
      context.logger.warn(
        `  ↳ TS Transloco configs now load through Node's type stripping, which rejects these files:\n` +
          unloadable.join('\n') +
          `\n    Replace syntax that needs compiling (enum, namespace, parameter properties) with plain objects.`,
      );
    }

    if (readers) return addCliDependency(tree, context, READER_EXPORT);
  };
}
