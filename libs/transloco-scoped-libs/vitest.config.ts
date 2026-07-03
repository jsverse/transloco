import { defineConfig, mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    plugins: [tsconfigPaths()],
    test: {
      name: 'transloco-scoped-libs',
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['src/test-setup.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco-scoped-libs',
      },
    },
  }),
);
