import { defineConfig, mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    // Resolve `@jsverse/*` aliases from the workspace `tsconfig.base.json`.
    // The lib's own tsconfig has `include: []` and the spec tsconfig only
    // includes `**/*.spec.ts`, so a default `tsconfigPaths()` won't rewrite
    // aliases inside non-spec files like `schematics-core/**` (which get
    // pulled in when a spec auto-mocks a wrapper module). The base config
    // carries every `paths` entry and no `include`, so it applies repo-wide.
    plugins: [tsconfigPaths({ projects: ['../../tsconfig.base.json'] })],
    test: {
      name: 'transloco-schematics',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      // SchematicTestRunner raw-`require()`s schematic factories from
      // collection.json, bypassing Vitest's transform/alias pipeline. This
      // setup installs an SWC require hook so those `.ts` factories transpile
      // and their `@jsverse/*` path aliases resolve. See the setup file for the
      // full rationale (including why `vi.mock` can't reach the schematic).
      setupFiles: ['../../tools/vitest/setup-schematics.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco-schematics',
      },
    },
  }),
);
