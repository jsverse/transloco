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
      name: 'transloco-persist-lang',
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['../../tools/vitest/setup-angular.ts'],
      // These specs install spies in `beforeAll` and rely on them persisting
      // across the block's tests (Jasmine treated beforeAll spies as
      // suite-lived). Opt out of the base's restoreMocks so Vitest doesn't
      // restore them before each test.
      restoreMocks: false,
      coverage: {
        reportsDirectory: '../../coverage/libs/transloco-persist-lang',
      },
    },
  }),
);
