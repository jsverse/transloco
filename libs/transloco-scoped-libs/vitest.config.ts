import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    test: {
      name: 'transloco-scoped-libs',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['src/test-setup.ts'],
      coverage: {
        reportsDirectory: '../../coverage/libs/transloco-scoped-libs',
      },
    },
  }),
);
