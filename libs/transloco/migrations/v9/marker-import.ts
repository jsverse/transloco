import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-keys-manager';
const SUBPATH = `${PACKAGE}/marker`;

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
    // A default/namespace-only clause, or a whole `import type {...}`, has
    // nothing that needs a runtime module to resolve from.
    if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    const elements = clause.namedBindings.elements;
    const markerElement = elements.find(
      (element) => (element.propertyName ?? element.name).text === 'marker',
    );
    if (!markerElement) continue;

    migrated++;

    const quote = source[statement.moduleSpecifier.getStart()];
    const importedName = markerElement.propertyName
      ? `marker as ${markerElement.name.text}`
      : 'marker';
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

    // Other specifiers stay on the main entry point: drop `marker` from that
    // list and add a second import statement for it right after.
    edits.push({
      start: clause.namedBindings.getStart(),
      end: clause.namedBindings.getEnd(),
      text: `{ ${remaining.map((element) => element.getText()).join(', ')} }`,
    });
    edits.push({
      start: statement.getEnd(),
      end: statement.getEnd(),
      text: `\nimport { ${importedName} } from ${quote}${SUBPATH}${quote};`,
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

/** Walks every `.ts` file in the tree, rewriting `marker` imports in place. */
export function migrateMarkerImport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;

    for (const path of collectFiles(tree, '', ['.ts'])) {
      const source = tree.read(path)?.toString();
      if (!source || !source.includes(PACKAGE)) continue;

      const result = migrateMarkerImportSource(source);
      if (!result) continue;

      tree.overwrite(path, result.content);
      migrated += result.migrated;
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Repointed ${migrated} marker import(s) to '${SUBPATH}'.`,
      );
    } else {
      context.logger.info('  ↳ No top-level marker imports found.');
    }
  };
}
