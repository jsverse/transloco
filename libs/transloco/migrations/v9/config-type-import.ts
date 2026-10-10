import * as nodeModule from 'node:module';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { loadDependencyRules, loadTypeScript } from './lazy-deps';
import { SCANNED } from './marker-import';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-utils';

/** Where the config type lives as of v9. */
const TYPE_PACKAGE = '@jsverse/transloco';
const TYPE_EXPORT = 'TranslocoGlobalConfig';

/** Where the config reader lives as of v9. */
const READER_PACKAGE = '@jsverse/transloco-cli';
const READER_EXPORT = 'getGlobalConfig';

/** The TS files cosmiconfig loads a Transloco config from by default. */
const CONFIG_FILE =
  /(?:^|\/)(?:transloco\.config|\.translocorc|\.config\/translocorc)\.[mc]?ts$/;

const TS_FILE = /\.[mc]?ts$/;

/** The sections of a `package.json` that make a package available to the workspace. */
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface ConfigTypeImportResult {
  content: string;
  /** The specifiers moved off `@jsverse/transloco-utils`. */
  migrated: number;
  /** How many of them are `getGlobalConfig`, now imported from the CLI. */
  readers: number;
}

type ImportSpecifier = import('typescript').ImportSpecifier;

/**
 * The braces of an import with only `group` in them. The original text is kept
 * whenever the group is the whole import, so spacing and the like survive.
 */
function namedImports(
  group: ImportSpecifier[],
  all: readonly ImportSpecifier[],
  original: string,
  dropTypeModifier: boolean,
): string {
  const unchanged =
    group.length === all.length &&
    !(dropTypeModifier && group.some((element) => element.isTypeOnly));
  if (unchanged) return original;

  const names = group.map((element) =>
    dropTypeModifier
      ? element.getText().replace(/^type\s+/, '')
      : element.getText(),
  );

  return `{ ${names.join(', ')} }`;
}

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
 * touched statements are rewritten, so the rest of the file stays as it was.
 */
export function migrateConfigTypeImportSource(
  source: string,
): ConfigTypeImportResult | null {
  const ts = loadTypeScript();
  if (!ts) return null;

  const file = ts.createSourceFile(
    'config-type-import.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
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

    const statements: string[] = [];
    if (typeElements.length) {
      statements.push(
        `import type ${namedImports(typeElements, elements, original, true)} ${from(TYPE_PACKAGE)}`,
      );
    }
    if (readerElements.length) {
      statements.push(
        `${runtimeKeyword} ${namedImports(readerElements, elements, original, false)} ${from(READER_PACKAGE)}`,
      );
    }
    if (kept.length) {
      statements.push(
        `${runtimeKeyword} ${namedImports(kept, elements, original, false)} ${from(PACKAGE)}`,
      );
    }

    const start = statement.getStart();
    const lineStart = source.lastIndexOf('\n', start - 1) + 1;
    const indent = /^\s*$/.test(source.slice(lineStart, start))
      ? source.slice(lineStart, start)
      : '';

    edits.push({
      start,
      end: statement.getEnd(),
      text: statements.join(`\n${indent}`),
    });
  }

  if (!edits.length) return null;

  let content = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  }

  return { content, migrated: types + readers, readers };
}

/**
 * Whether `source` still names `@jsverse/transloco-utils` as a module:
 * a default or namespace import, a name that has no new home, a `require()`,
 * an `import()` or a re-export. Those are left as they are.
 */
export function referencesConfigPackage(source: string): boolean {
  if (!source.includes(PACKAGE)) return false;

  const ts = loadTypeScript();
  // Without the parser nothing was migrated either, so say it was left alone.
  if (!ts) return true;

  const file = ts.createSourceFile(
    'config-type-import.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const mentions = (node: import('typescript').Node): boolean =>
    (ts.isStringLiteralLike(node) && node.text === PACKAGE) ||
    (ts.forEachChild(node, (child) => mentions(child) || undefined) ?? false);

  return mentions(file);
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

/** The version of this `@jsverse/transloco`, which `ng update` has installed by the time it runs. */
function installedVersion(): string | null {
  try {
    const manifest = nodeModule.createRequire(__filename)(
      '../../package.json',
    ) as { version?: string };

    return manifest.version ?? null;
  } catch {
    return null;
  }
}

/** Whether the root `package.json` lists `name`, or `null` when it can't be read. */
function isListed(tree: Tree, name: string): boolean | null {
  try {
    const manifest = JSON.parse(tree.read('/package.json')?.toString() ?? '');
    if (!manifest || typeof manifest !== 'object') return null;

    return DEPENDENCY_SECTIONS.some((section) => manifest[section]?.[name]);
  } catch {
    return null;
  }
}

/**
 * Adds the CLI to the workspace's `devDependencies` when it isn't listed yet,
 * at the range of the `@jsverse/transloco` v9 that is installed, and schedules
 * the install.
 */
function addReaderPackage(tree: Tree, context: SchematicContext): Rule | void {
  const manual = `  ↳ Add '${READER_PACKAGE}' to your devDependencies: files in your workspace import getGlobalConfig from it now.`;

  const listed = isListed(tree, READER_PACKAGE);
  if (listed) return;

  const version = installedVersion();
  const rules = loadDependencyRules();
  if (listed === null || !version || !rules) {
    context.logger.warn(manual);
    return;
  }

  context.logger.info(
    `  ↳ Added '${READER_PACKAGE}@^${version}' to devDependencies.`,
  );

  return rules.addDependency(READER_PACKAGE, `^${version}`, {
    type: rules.DependencyType.Dev,
    existing: rules.ExistingBehavior.Skip,
  });
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

    for (const path of collectFiles(tree, '', SCANNED)) {
      const isConfig = CONFIG_FILE.test(path);
      let source = tree.read(path)?.toString();
      if (!source) continue;
      if (!isConfig && !source.includes(PACKAGE)) continue;

      const result = source.includes(PACKAGE)
        ? migrateConfigTypeImportSource(source)
        : null;
      if (result) {
        tree.overwrite(path, result.content);
        migrated += result.migrated;
        readers += result.readers;
        source = result.content;
      }

      if (referencesConfigPackage(source)) leftovers.push(path);

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

    if (readers) return addReaderPackage(tree, context);
  };
}
