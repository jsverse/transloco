import {
  Rule,
  SchematicContext,
  Tree,
  chain,
} from '@angular-devkit/schematics';

import { migrateInlineTemplates, migrateTemplate } from './template-utils';
import { collectFiles } from './workspace-utils';
import { addGlobalTranslateFn } from './global-translate-fn';
import { reportVersionFloors } from './report-version-floors';

/**
 * Replaces `translocoRead` with `translocoPrefix`. Walks the whole tree rather
 * than per project - templates need not belong to a workspace project.
 */
function migrateTranslocoRead(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let renamed = 0;
    let removed = 0;
    let skipped = 0;
    let ambiguous = 0;

    // One walk for both extensions; visiting the tree is the expensive part.
    for (const path of collectFiles(tree, '', ['.html', '.ts'])) {
      const source = tree.read(path)?.toString();
      if (!source) continue;

      const result = path.endsWith('.html')
        ? migrateTemplate(source)
        : migrateInlineTemplates(source);
      if (!result) continue;

      if (result.content !== source) tree.overwrite(path, result.content);
      renamed += result.renamed;
      removed += result.removed;

      // A template that doesn't parse is already broken, so there is nothing
      // worth migrating in it - but say so rather than passing over it quietly.
      if (result.skipped) {
        skipped += result.skipped;
        context.logger.warn(
          `  ↳ Unable to parse ${path}, skipping. Rename translocoRead to translocoPrefix by hand.`,
        );
      }

      if (result.ambiguous) {
        ambiguous += result.ambiguous;
        context.logger.warn(
          `  ↳ ${path} sets translocoPrefix alongside translocoRead, to an expression or\n` +
            `    to an interpolated value this migration cannot read.\n` +
            `    v8 fell back to the read whenever that prefix came out empty, which only the\n` +
            `    running app can decide - the read was dropped, so check this one by hand.`,
        );
      }
    }

    if (renamed) {
      context.logger.info(
        `  ↳ Renamed ${renamed} translocoRead binding(s) to translocoPrefix.`,
      );
    }

    if (removed) {
      context.logger.info(
        `  ↳ Removed ${removed} redundant translocoRead binding(s) from elements that already had translocoPrefix.`,
      );
    }

    if (!renamed && !removed && !skipped && !ambiguous) {
      context.logger.info('  ↳ No translocoRead usages found.');
    }
  };
}

export function migrateToV9(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Migrating your workspace to Transloco v9...');

    return chain([
      migrateTranslocoRead(),
      addGlobalTranslateFn(),
      reportVersionFloors(),
    ])(tree, context);
  };
}
