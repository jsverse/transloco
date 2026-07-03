import { defineConfig, mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    plugins: [tsconfigPaths({ projects: ['../../tsconfig.base.json'] })],
    test: {
      name: 'transloco-validator',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco-validator',
      },
    },
  }),
);
