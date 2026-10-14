import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { SCANNED } from './marker-import';
import { collectFiles } from './workspace-utils';

const PACKAGE = '@jsverse/transloco-scoped-libs';
const PLUGIN = 'TranslocoScopedLibsWebpackPlugin';

/**
 * An `import`/`require`/`import()` of the plugin entry, in any quote style.
 * `/webpack` is the specifier the docs gave, `/webpack.plugin` the file that
 * actually shipped.
 */
const PLUGIN_SPECIFIER =
  /(['"`])@jsverse\/transloco-scoped-libs\/webpack(\.plugin)?(\.js)?\1/;

/** The plugin's class name, however the file got hold of it. */
const PLUGIN_IDENTIFIER = /\bTranslocoScopedLibsWebpackPlugin\b/;

/** Whether `source` still loads or names the webpack plugin, which v9 removed. */
export function referencesScopedLibsWebpackPlugin(source: string): boolean {
  return PLUGIN_SPECIFIER.test(source) || PLUGIN_IDENTIFIER.test(source);
}

/**
 * Reports the files still loading the scoped-libs webpack plugin.
 *
 * v9 removed it: Angular's default builder no longer runs webpack, and all the
 * plugin did was spawn `transloco-scoped-libs --watch` next to the build.
 * Running that command is a change to the workspace's scripts rather than to
 * the file loading the plugin, so those files are reported instead of edited.
 */
export function reportScopedLibsWebpackPlugin(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const references: string[] = [];

    for (const path of collectFiles(tree, '', SCANNED)) {
      const source = tree.read(path)?.toString();
      if (!source || !referencesScopedLibsWebpackPlugin(source)) continue;

      references.push(path);
    }

    if (references.length) {
      context.logger.warn(
        `  ↳ ${PLUGIN} was removed from '${PACKAGE}', but these files still reference it:\n` +
          references.map((path) => `    - ${path}`).join('\n') +
          `\n    Run 'transloco-scoped-libs --watch' alongside your dev server instead` +
          ` (or 'transloco scoped-libs --watch' with '@jsverse/transloco-cli').`,
      );
    }
  };
}
