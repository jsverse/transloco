/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

import { baseConfig } from '../../tools/vitest/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    plugins: [angular()],
    test: {
      name: 'transloco-locale',
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['../../tools/vitest/setup-angular.ts'],
      coverage: {
        reportsDirectory: '../../coverage/libs/transloco-locale',
      },
    },
  }),
);
