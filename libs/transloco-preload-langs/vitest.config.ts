/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    plugins: [
      angular(),
      tsconfigPaths({ projects: ['../../tsconfig.base.json'] }),
    ],
    test: {
      name: 'transloco-preload-langs',
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reportsDirectory: '../../coverage/libs/transloco-preload-langs',
      },
    },
  }),
);
