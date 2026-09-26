import * as nodeModule from 'node:module';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-utils';

/** The package's type-only exports - nothing to import at runtime. */
const TYPE_EXPORTS = new Set(['TranslocoGlobalConfig']);

/** The TS files cosmiconfig loads a Transloco config from by default. */
const CONFIG_FILE =
  /(?:^|\/)(?:transloco\.config|\.translocorc|\.config\/translocorc)\.[mc]?ts$/;

const SCANNED = ['.ts', '.mts', '.cts'];

interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface ConfigTypeImportResult {
  content: string;
  migrated: number;
}

/**
 * Marks imports of `TranslocoGlobalConfig` from `@jsverse/transloco-utils` as
 * type-only.
 *
 * v9 loads TS configs through cosmiconfig 10, which runs them with Node's own
 * type stripping rather than compiling them with TypeScript. Node erases
 * `import type` but keeps a plain import of an interface as a runtime import,
 * which then fails because the package exports no such binding - the config
 * v8's schematics generated no longer loads.
 *
 * A clause importing only types becomes `import type`; a clause mixing in
 * runtime bindings gets an inline `type` modifier on the types instead. Only
 * the touched specifiers are edited, so the rest of the file stays as it was.
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
  let migrated = 0;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== PACKAGE
    )
      continue;

    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    const elements = clause.namedBindings.elements;
    const untyped = elements.filter(
      (element) =>
        !element.isTypeOnly &&
        TYPE_EXPORTS.has((element.propertyName ?? element.name).text),
    );
    if (!untyped.length) continue;

    migrated += untyped.length;

    // `import type { type X }` doesn't compile, so the whole clause only turns
    // type-only when none of its specifiers carries the modifier already.
    const typeOnlyClause = !clause.name && untyped.length === elements.length;

    if (typeOnlyClause) {
      edits.push({
        start: clause.getStart(),
        end: clause.getStart(),
        text: 'type ',
      });
      continue;
    }

    for (const element of untyped) {
      edits.push({
        start: element.getStart(),
        end: element.getStart(),
        text: 'type ',
      });
    }
  }

  if (!migrated) return null;

  let content = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  }

  return { content, migrated };
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
 * Walks the tree marking config type imports as type-only, then reports any
 * Transloco config that still can't load under Node's type stripping.
 *
 * Every TS file importing from the package is scanned, not just the default
 * config names: `--config` accepts any path, and the rewrite is safe in any
 * TS file.
 */
export function migrateConfigTypeImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
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
        source = result.content;
      }

      if (!isConfig && !result) continue;

      const error = findStrippingError(source);
      if (error) unloadable.push(`    - ${path}: ${error}`);
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Marked ${migrated} TranslocoGlobalConfig import(s) as type-only.`,
      );
    } else {
      context.logger.info('  ↳ No TranslocoGlobalConfig value imports found.');
    }

    if (unloadable.length) {
      context.logger.warn(
        `  ↳ TS Transloco configs now load through Node's type stripping, which rejects these files:\n` +
          unloadable.join('\n') +
          `\n    Replace syntax that needs compiling (enum, namespace, parameter properties) with plain objects.`,
      );
    }
  };
}
