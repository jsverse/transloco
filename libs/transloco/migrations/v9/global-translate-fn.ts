import {
  Rule,
  SchematicContext,
  Tree,
  chain,
} from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility/standalone/rules';
import { getMainFilePath } from '@schematics/angular/utility/standalone/util';

import { collectFiles, getProjects } from './workspace-utils';

const TRANSLOCO_IMPORT =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@jsverse\/transloco['"]/g;

/** The standalone functions that stopped being auto-wired in v9. */
const GLOBAL_FNS = ['translate', 'translateObject'];

/**
 * Matches on import specifiers rather than call sites, so a local helper named
 * `translate` isn't mistaken for the global one.
 */
export function usesGlobalTranslateFn(source: string): boolean {
  TRANSLOCO_IMPORT.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TRANSLOCO_IMPORT.exec(source)) !== null) {
    const imported = match[1].split(',').map((specifier) =>
      specifier
        .trim()
        .split(/\s+as\s+/)[0]
        .trim(),
    );

    if (imported.some((name) => GLOBAL_FNS.includes(name))) return true;
  }

  return false;
}

/**
 * Adds `provideGlobalTranslateFn()` to applications that use the standalone
 * functions, restoring the wiring v8 did implicitly. Projects that don't import
 * them are skipped, preserving the SSR/MFE opt-out.
 *
 * Works in Nx workspaces too: `nx migrate` reads the same `ng-update` key, and
 * Nx's CLI adapter serves a virtual `angular.json` built from the project
 * graph, which is what Angular's own migrations rely on as well.
 */
export function addGlobalTranslateFn(): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const projects = getProjects(tree);

    // Neither a real nor a virtual workspace - a bare library, or an Nx repo
    // without the Angular plugin. `addRootProvider` needs a registered project.
    if (!projects.length) {
      reportUnwiredUsage(tree, context);

      return;
    }

    const rules: Rule[] = [];
    const librariesWithUsage: string[] = [];
    const unresolved: string[] = [];

    for (const project of projects) {
      const sources = collectFiles(tree, project.sourceRoot, ['.ts']);
      const contents = sources
        .map((path) => tree.read(path)?.toString() ?? '')
        .filter((source) => source.includes('@jsverse/transloco'));

      if (!contents.some(usesGlobalTranslateFn)) continue;

      // Already migrated - either by a previous run or by hand.
      if (
        contents.some((source) => source.includes('provideGlobalTranslateFn'))
      )
        continue;

      if (!project.isApplication) {
        librariesWithUsage.push(project.name);
        continue;
      }

      // A project whose builder exposes no entry point - possible for some Nx
      // executors - can't be wired. Skip it rather than aborting the migration,
      // which would roll back the template rewrites too.
      try {
        await getMainFilePath(tree, project.name);
      } catch {
        unresolved.push(project.name);
        continue;
      }

      rules.push(
        addRootProvider(
          project.name,
          ({ code, external }) =>
            code`${external('provideGlobalTranslateFn', '@jsverse/transloco')}()`,
        ),
      );
      context.logger.info(
        `  ↳ Added provideGlobalTranslateFn() to "${project.name}".`,
      );
    }

    if (unresolved.length) {
      context.logger.warn(
        `  ↳ Could not find an entry point for: ${unresolved.join(', ')}.\n` +
          `    Add provideGlobalTranslateFn() to their providers by hand.`,
      );
    }

    if (librariesWithUsage.length) {
      context.logger.warn(
        `  ↳ The following libraries use translate()/translateObject(): ${librariesWithUsage.join(
          ', ',
        )}.\n` +
          `    Libraries cannot provide it themselves - the consuming application must call\n` +
          `    provideGlobalTranslateFn() for these functions to keep working.`,
      );
    }

    return chain(rules);
  };
}

/** How many offending files to name before collapsing the rest into a count. */
const MAX_REPORTED_FILES = 10;

/**
 * Names the files that need `provideGlobalTranslateFn()` when it can't be added
 * for them. Stays quiet if the provider already appears somewhere in the tree,
 * since it is usually declared far from the call sites.
 */
function reportUnwiredUsage(tree: Tree, context: SchematicContext) {
  const sources = collectFiles(tree, '', ['.ts'])
    .map((path) => [path, tree.read(path)?.toString() ?? ''] as const)
    .filter(([, source]) => source.includes('@jsverse/transloco'));

  if (sources.some(([, source]) => source.includes('provideGlobalTranslateFn')))
    return;

  const users = sources
    .filter(([, source]) => usesGlobalTranslateFn(source))
    .map(([path]) => path);

  if (!users.length) return;

  const shown = users.slice(0, MAX_REPORTED_FILES);
  const rest = users.length - shown.length;

  context.logger.warn(
    `  ↳ No Angular workspace file found, so provideGlobalTranslateFn() could not be\n` +
      `    added automatically. Add it to your application providers - without it the\n` +
      `    following files get '' / [] back from translate()/translateObject():\n` +
      shown.map((path) => `      ${path}`).join('\n') +
      (rest > 0 ? `\n      ...and ${rest} more` : ''),
  );
}
