import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Workspace root (this file lives at <root>/tools/vitest). Each project sets its
// own `root`, so shared setup files two levels up need it in `server.fs.allow`.
const workspaceRoot = resolve(__dirname, '../..');

/**
 * Shared Vitest base config, merged into every project's vitest.config.ts via
 * `mergeConfig(baseConfig, ...)`. Keeps runner-wide behavior in one place while
 * each project owns its `name`, `include`, `environment`, and coverage dir.
 */
export const baseConfig = defineConfig({
  // Resolve workspace `@jsverse/*` aliases from tsconfig.base for every project.
  // Paths resolve relative to each merged project's `root` (its own dir).
  plugins: [tsconfigPaths({ projects: ['../../tsconfig.base.json'] })],
  // Let jsdom projects load shared setup files from tools/vitest, which sit
  // outside each project's `root` (Vite blocks out-of-root fs access by default).
  server: { fs: { allow: [workspaceRoot] } },
  test: {
    // Specs call describe/it/expect/beforeEach with no imports (Jasmine legacy),
    // so keep the test APIs ambient. `vi` is also exposed globally.
    globals: true,
    // `forks` (not `threads`) so specs using process.chdir/process.cwd work
    // (transloco-scoped-libs). chdir is unavailable on worker threads.
    pool: 'forks',
    passWithNoTests: true,
    // Mirror Jasmine's per-spec spy reset — critical for the Intl.* spies in
    // transloco-locale that would otherwise leak across tests. Libs that install
    // spies in beforeAll (e.g. transloco-persist-lang) override this to false.
    restoreMocks: true,
    reporters: ['default'],
    // @ngneat/spectator ships a prebuilt fesm bundle; without inlining it, its
    // `@angular/core/testing` import resolves to a different module instance
    // than the test setup initializes, so TestBed appears uninitialized.
    // Harmless for node-env libs that don't import spectator.
    server: { deps: { inline: [/@ngneat\/spectator/] } },
    // v8 is Vitest's default provider; pinned here so each project's coverage
    // block only needs its own reportsDirectory. Enabled in CI (where `CI` is
    // set) so the coverage `outputs` declared in each project.json are actually
    // produced; skipped locally to keep interactive runs fast. The `test`
    // target lists `CI` as an input so Nx never serves a no-coverage cache hit
    // for a CI run.
    coverage: { provider: 'v8', enabled: !!process.env['CI'] },
  },
});
