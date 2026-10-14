/**
 * Every package the migration leans on is resolved lazily and defensively.
 *
 * All of them ship with a normal Angular workspace, but they arrive by
 * different routes - `@schematics/angular` only comes with `@angular/cli` or
 * `@nx/angular`, not with `@angular/build` - and these are top-level imports in
 * a rule chain. Letting one missing package throw at module load would take the
 * whole migration down, template rewrite included, rather than degrading to a
 * warning about the one part that could not run.
 */

import { createRequire } from 'node:module';

import type { Rule, Tree } from '@angular-devkit/schematics';

/** Resolves from this file, so the workspace's own copies are the ones found. */
const resolve = createRequire(__filename);

type CompilerModule = typeof import('@angular/compiler');
type TypeScriptModule = typeof import('typescript');

interface StandaloneRules {
  addRootProvider: (
    project: string,
    callback: (api: {
      code: (strings: TemplateStringsArray, ...args: unknown[]) => unknown;
      external: (symbol: string, moduleName: string) => unknown;
    }) => unknown,
  ) => Rule;
  getMainFilePath: (tree: Tree, project: string) => Promise<string>;
}

/** `undefined` means "not tried yet"; `null` means "tried, not available". */
let compiler: CompilerModule | null | undefined;
let typescript: TypeScriptModule | null | undefined;
let standalone: StandaloneRules | null | undefined;

function attempt<T>(load: () => T): T | null {
  try {
    return load();
  } catch {
    return null;
  }
}

/** The template parser. A direct dependency of every `ng new` workspace. */
export function loadCompiler(): CompilerModule | null {
  if (compiler === undefined) {
    compiler = attempt(() => resolve('@angular/compiler') as CompilerModule);
  }

  return compiler;
}

/** Used to find inline templates and to read import declarations. */
export function loadTypeScript(): TypeScriptModule | null {
  if (typescript === undefined) {
    typescript = attempt(() => resolve('typescript') as TypeScriptModule);
  }

  return typescript;
}

/** The root-provider helpers, which only ship with the CLI or `@nx/angular`. */
export function loadStandaloneRules(): StandaloneRules | null {
  if (standalone === undefined) {
    standalone = attempt(() => ({
      addRootProvider: (
        resolve(
          '@schematics/angular/utility/standalone/rules',
        ) as StandaloneRules
      ).addRootProvider,
      getMainFilePath: (
        resolve(
          '@schematics/angular/utility/standalone/util',
        ) as StandaloneRules
      ).getMainFilePath,
    }));
  }

  return standalone;
}
