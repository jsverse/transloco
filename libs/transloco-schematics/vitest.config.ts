import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
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
        reportsDirectory: '../../coverage/libs/transloco-schematics',
      },
    },
  }),
);
