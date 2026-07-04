import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    test: {
      name: 'transloco-validator',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      coverage: {
        reportsDirectory: '../../coverage/libs/transloco-validator',
      },
    },
  }),
);
