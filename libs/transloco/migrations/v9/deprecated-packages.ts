import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { isManifest } from './cli-scripts';
import { referencesConfigPackage } from './config-type-import';
import { collectFiles, collectMatching } from './workspace-utils';

const UTILS_PACKAGE = '@jsverse/transloco-utils';
const SCRIPT_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
];
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** The deprecated packages that have a bin, and what runs in their place. */
const REPLACEMENTS: Record<string, string> = {
  '@jsverse/transloco-keys-manager': `'transloco extract' and 'transloco find'`,
  '@jsverse/transloco-optimize': `'transloco optimize'`,
  '@jsverse/transloco-scoped-libs': `'transloco scoped-libs'`,
  '@jsverse/transloco-validator': `'transloco validate'`,
};

/** Whether anything in the workspace still names the utils package as a module. */
function utilsStillReferenced(tree: Tree): boolean {
  return collectFiles(tree, '', SCRIPT_EXTENSIONS).some((path) => {
    const source = tree.read(path)?.toString();

    return (
      !!source?.includes(UTILS_PACKAGE) && referencesConfigPackage(source, path)
    );
  });
}

/**
 * Names the deprecated `@jsverse` packages that are still listed in a
 * `package.json`, and what replaces each one.
 *
 * It reports on every run for as long as a package is installed: whether
 * something still runs its bin - a script, a Makefile, a CI step - can't be
 * told from here, so the notice doesn't depend on what this run moved.
 * `@jsverse/transloco-utils` has no bin, so it is reported once no file
 * imports it any more.
 */
export function reportDeprecatedPackages(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const found: Array<{ path: string; name: string }> = [];

    for (const path of collectMatching(tree, isManifest)) {
      let manifest: Record<string, unknown>;

      try {
        manifest = JSON.parse(
          (tree.read(path)?.toString() ?? '').replace(/^\uFEFF/, ''),
        );
      } catch {
        continue;
      }

      for (const name of [...Object.keys(REPLACEMENTS), UTILS_PACKAGE]) {
        const listed = DEPENDENCY_FIELDS.some((field) => {
          const section = manifest?.[field];

          return !!section && typeof section === 'object' && name in section;
        });

        if (listed) found.push({ path, name });
      }
    }

    if (!found.length) return;

    const utilsFree =
      found.some(({ name }) => name === UTILS_PACKAGE) &&
      !utilsStillReferenced(tree);
    const lines = found
      .filter(({ name }) => name !== UTILS_PACKAGE || utilsFree)
      .map(({ path, name }) =>
        name === UTILS_PACKAGE
          ? `    - ${path}: ${name} (no file imports it any more, remove it)`
          : `    - ${path}: ${name} (replaced by ${REPLACEMENTS[name]} of @jsverse/transloco-cli)`,
      );

    if (!lines.length) return;

    context.logger.info(
      `  ↳ These deprecated packages are still in your dependencies:\n${lines.join('\n')}\n` +
        `    Remove each one once nothing runs its bin anymore - scripts, Makefiles, CI and git hooks included.`,
    );
  };
}
