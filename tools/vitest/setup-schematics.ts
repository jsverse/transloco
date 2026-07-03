/**
 * Vitest setup for specs that exercise Angular schematics via
 * `SchematicTestRunner` (`@angular-devkit/schematics/testing`).
 *
 * WHY THIS EXISTS
 * ---------------
 * `SchematicTestRunner` loads schematic factories through `@angular-devkit`'s
 * `ExportStringRef`, which does a *raw* Node `require()` of the extensionless
 * paths declared in `collection.json` (e.g. `"./split/index"` ->
 * `.../src/split/index`). That raw require runs entirely inside
 * `@angular-devkit` and bypasses Vitest's transform + alias pipeline, so under
 * Vitest it breaks in two ways:
 *
 *   1. Node cannot load the `.ts` factory file. Node 24's type-stripping only
 *      applies to native ESM (and fails on the schematics' directory/CJS-style
 *      imports), and there is no TS transpile hook for `require()` (under Jest,
 *      `ts-jest` provided this).
 *   2. tsconfig `paths` aliases (e.g. `@jsverse/transloco-utils`, mapped in
 *      `tsconfig.base.json` to `libs/transloco-utils/src/index.ts`) are not
 *      resolved – that mapping only lives in the Vite/tsconfig pipeline, not in
 *      Node's resolver.
 *
 * THE FIX
 * -------
 * Install `@swc-node/register` inside the (forked) Vitest worker. It:
 *   - hooks `require` via `pirates` so `.ts`/`.tsx` files are transpiled by SWC
 *     to CommonJS on the fly (and registers the TS extensions so extensionless
 *     `require`/`require.resolve` of a `.ts` factory works), and
 *   - is fed the workspace tsconfig `baseUrl` + `paths`, so SWC rewrites alias
 *     imports (`@jsverse/*`) to their real source paths during transpilation.
 *
 * NOTE ON MOCKS: because the factory graph is loaded by Node's `require` (not
 * Vitest's runner), `vi.mock(...)` does NOT reach modules imported by the
 * schematic itself. Specs that need to stub a module the schematic depends on
 * (e.g. `getGlobalConfig`) must spy on the *Node-required* instance of that
 * module (grab it via `createRequire(...)`), so they share the same cached
 * module object as the schematic. See `join.spec.ts` for an example.
 *
 * REUSABILITY
 * -----------
 * This file is intentionally lib-agnostic (it derives the workspace root from
 * its own location) so any project whose specs use `SchematicTestRunner` can
 * reference it from `test.setupFiles` – e.g. the core `transloco` library's
 * `test-schematics` target, which uses the same runner and the same
 * `@jsverse/transloco-utils` alias.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `@swc-node/register` only ships CommonJS `require`/`node` export conditions,
// so it can't be statically `import`ed through Vite's ESM analysis. Load it
// with a runtime `require` instead – this is exactly the CJS API we want here.
const require = createRequire(import.meta.url);
const { readDefaultTsConfig } =
  require('@swc-node/register/read-default-tsconfig') as typeof import('@swc-node/register/read-default-tsconfig');
const { register } =
  require('@swc-node/register/register') as typeof import('@swc-node/register/register');

// This file lives at <workspaceRoot>/tools/vitest/setup-schematics.ts.
const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// `tsconfig.base.json` holds the workspace-wide `paths` (and `baseUrl: "."`),
// which is what lets SWC resolve `@jsverse/*` aliases to their source files.
const tsConfigPath = join(workspaceRoot, 'tsconfig.base.json');

// Parse the tsconfig into SWC-compatible compiler options. `readDefaultTsConfig`
// also defaults `baseUrl` to the tsconfig's directory when only `paths` is set.
const compilerOptions = readDefaultTsConfig(tsConfigPath);

// Installs the pirates require-hook. `register` forces CommonJS output so the
// transpiled modules are loadable by Node's `require`.
register(compilerOptions);
