import {
  Rule,
  SchematicContext,
  Tree,
  chain,
} from '@angular-devkit/schematics';

import { loadStandaloneRules, loadTypeScript } from './lazy-deps';
import { collectFiles, getProjects } from './workspace-utils';

const TRANSLOCO_PACKAGE = '@jsverse/transloco';

/** The standalone functions that stopped being auto-wired in v9. */
const GLOBAL_FNS = ['translate', 'translateObject'];

/**
 * Whether `source` reaches for `translate()`/`translateObject()` at runtime.
 *
 * Detection is anchored on the import rather than on call sites, so a local
 * helper that happens to be named `translate` is not mistaken for the global
 * one. Reading the import declarations from the AST rather than by pattern is
 * what lets `import type { translate }` be recognised for what it is: erased
 * before the app ever runs, so it needs no provider.
 */
export function usesGlobalTranslateFn(source: string): boolean {
  const ts = loadTypeScript();
  if (!ts) return false;

  const file = ts.createSourceFile(
    'transloco-usage.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== TRANSLOCO_PACKAGE
    )
      continue;

    // `import type { ... }` disappears at compile time, so it is not usage.
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;

    const bindings = clause.namedBindings;

    // `import * as transloco` only counts if the namespace is actually called.
    if (ts.isNamespaceImport(bindings)) {
      if (callsNamespacedGlobalFn(file, bindings.name.text, ts)) return true;

      continue;
    }

    const imports = bindings.elements.some(
      (element) =>
        !element.isTypeOnly &&
        GLOBAL_FNS.includes((element.propertyName ?? element.name).text),
    );

    if (imports) return true;
  }

  return false;
}

const PROVIDER_FN = 'provideGlobalTranslateFn';

/**
 * Whether `source` actually calls `provideGlobalTranslateFn()`.
 *
 * The check is on a call expression rather than on the text, so a mention in a
 * comment, a doc string or an unrelated identifier cannot make the migration
 * believe a project is already wired and skip it. Any call counts, wherever it
 * lives: extracting providers into their own file and spreading them into
 * `app.config.ts` is a normal thing to do.
 */
export function providesGlobalTranslateFn(source: string): boolean {
  const ts = loadTypeScript();
  if (!ts) return false;

  const file = ts.createSourceFile(
    'transloco-providers.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  let found = false;

  const visit = (node: import('typescript').Node): void => {
    if (found) return;

    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : undefined;

      if (name === PROVIDER_FN) {
        found = true;

        return;
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(file, visit);

  return found;
}

/** Whether `namespace.translate(...)` or `.translateObject(...)` is called. */
function callsNamespacedGlobalFn(
  file: import('typescript').SourceFile,
  namespace: string,
  ts: NonNullable<ReturnType<typeof loadTypeScript>>,
): boolean {
  let found = false;

  const visit = (node: import('typescript').Node): void => {
    if (found) return;

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === namespace &&
      GLOBAL_FNS.includes(node.expression.name.text)
    ) {
      found = true;

      return;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(file, visit);

  return found;
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

    // Only ships with `@angular/cli` or `@nx/angular`. Without it the provider
    // cannot be wired, but the template rewrite has already run and stands.
    const standalone = loadStandaloneRules();
    if (!standalone) {
      context.logger.warn(
        `  ↳ @schematics/angular is not installed, so provideGlobalTranslateFn() could not\n` +
          `    be added automatically. Add it to your application providers by hand.`,
      );

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

      // Already wired - by a previous run or by hand. The guard has to stay:
      // `addRootProvider` inserts unconditionally, with no duplicate check of
      // its own, so a second run would add a second call.
      if (contents.some(providesGlobalTranslateFn)) continue;

      if (!project.isApplication) {
        librariesWithUsage.push(project.name);
        continue;
      }

      // A project whose builder exposes no entry point - possible for some Nx
      // executors - can't be wired. Skip it rather than aborting the migration,
      // which would roll back the template rewrites too.
      try {
        await standalone.getMainFilePath(tree, project.name);
      } catch {
        unresolved.push(project.name);
        continue;
      }

      rules.push(
        standalone.addRootProvider(
          project.name,
          ({ code, external }) =>
            code`${external(PROVIDER_FN, TRANSLOCO_PACKAGE)}()`,
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

  if (sources.some(([, source]) => providesGlobalTranslateFn(source))) return;

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
