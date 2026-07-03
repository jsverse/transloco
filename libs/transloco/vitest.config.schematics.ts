import { defineConfig, mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    // Resolve `@jsverse/*` aliases (e.g. @jsverse/transloco-utils) from the
    // workspace `tsconfig.base.json` — the ng-add schematic reads them.
    plugins: [tsconfigPaths({ projects: ['../../tsconfig.base.json'] })],
    test: {
      name: 'transloco-schematics-spec',
      environment: 'node',
      include: ['schematics/**/*.spec.ts'],
      // ng-add.spec uses SchematicTestRunner, which raw-`require()`s schematic
      // factories, bypassing Vitest's transform/alias pipeline. This shared
      // setup installs an SWC require hook so those `.ts` factories transpile
      // and their `@jsverse/*` aliases resolve. See the setup file for details.
      setupFiles: ['../../tools/vitest/setup-schematics.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco',
        include: ['schematics/**/*.ts'],
        exclude: ['schematics/**/*.spec.ts'],
      },
    },
  }),
);
