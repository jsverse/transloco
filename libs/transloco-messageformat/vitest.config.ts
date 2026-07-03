/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    // angular(): JIT-compile Angular templates/decorators through Vite.
    // tsconfigPaths: resolve workspace `@jsverse/*` aliases from tsconfig.base.
    plugins: [
      angular(),
      tsconfigPaths({ projects: ['../../tsconfig.base.json'] }),
    ],
    test: {
      name: 'transloco-messageformat',
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['src/test-setup.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco-messageformat',
      },
    },
  }),
);
