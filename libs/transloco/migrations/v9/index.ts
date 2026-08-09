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

    // One walk for both extensions; visiting the tree is the expensive part.
    for (const path of collectFiles(tree, '', ['.html', '.ts'])) {
      const source = tree.read(path)?.toString();
      if (!source) continue;

      if (path.endsWith('.html')) {
        const result = migrateTemplate(source);
        if (!result) continue;

        tree.overwrite(path, result.content);
        renamed += result.renamed;
        removed += result.removed;
        continue;
      }

      const result = migrateInlineTemplates(source);
      if (!result) continue;

      if (result.content !== source) tree.overwrite(path, result.content);
      renamed += result.renamed;
      removed += result.removed;

      if (result.skipped) {
        skipped += result.skipped;
        context.logger.warn(
          `  ↳ Could not parse an inline template in ${path}. Rename translocoRead to translocoPrefix by hand.`,
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

    if (!renamed && !removed && !skipped) {
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
