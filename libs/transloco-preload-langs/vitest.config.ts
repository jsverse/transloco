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
      name: 'transloco-preload-langs',
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      coverage: {
        reportsDirectory: '../../coverage/libs/transloco-preload-langs',
      },
    },
  }),
);
