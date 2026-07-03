import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest base config, merged into every project's vitest.config.ts via
 * `mergeConfig(baseConfig, ...)`. Keeps runner-wide behavior in one place while
 * each project owns its `name`, `include`, `environment`, and coverage dir.
 */
export const baseConfig = defineConfig({
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
  },
});
