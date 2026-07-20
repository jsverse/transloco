import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import run from './transloco-scoped-libs';

const TEST_DIR = resolve(__dirname, '../../test-multi-scope');

describe('Multi-scope i18n with join strategy', () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Create test structure
    mkdirSync(join(TEST_DIR, 'libs/feature/client/src/i18n/getText'), {
      recursive: true,
    });
    mkdirSync(join(TEST_DIR, 'apps/client/src/assets/i18n'), {
      recursive: true,
    });

    // Create package.json with multiple scopes
    writeFileSync(
      join(TEST_DIR, 'libs/feature/client/package.json'),
      JSON.stringify(
        {
          name: '@test/feature-client',
          version: '0.0.0',
          i18n: [
            {
              scope: 'feature-client-getText',
              path: 'src/i18n/getText',
              strategy: 'join',
            },
            {
              scope: 'feature-client',
              path: 'src/i18n',
              strategy: 'join',
            },
          ],
        },
        null,
        2,
      ),
    );

    // Create translation files
    writeFileSync(
      join(TEST_DIR, 'libs/feature/client/src/i18n/getText/en.json'),
      JSON.stringify(
        {
          'FeatureClientUser Id': 'FeatureClientUser Id',
        },
        null,
        2,
      ),
    );

    writeFileSync(
      join(TEST_DIR, 'libs/feature/client/src/i18n/en.json'),
      JSON.stringify(
        {
          'client feature transloco message':
            'client feature transloco message',
          'FeatureClientUser Username': 'FeatureClientUser Username',
          'FeatureClientUser Password': 'FeatureClientUser Password',
        },
        null,
        2,
      ),
    );
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it(`GIVEN a library with multiple scopes using the join strategy
      WHEN running transloco-scoped-libs
      THEN it should merge all scope data into a single vendor.json without loss`, async () => {
    // Change to test directory
    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      // Run transloco-scoped-libs
      await run({
        watch: false,
        skipGitIgnoreUpdate: true,
        rootTranslationsPath: './apps/client/src/assets/i18n/',
        scopedLibs: ['libs/feature/client'],
      });

      // Read the output file
      const outputPath = join(
        TEST_DIR,
        'apps/client/src/assets/i18n/en.vendor.json',
      );
      expect(existsSync(outputPath)).toBe(true);

      const output = JSON.parse(readFileSync(outputPath, 'utf-8'));

      // Should have both scopes
      expect(Object.keys(output)).toContain('feature-client-getText');
      expect(Object.keys(output)).toContain('feature-client');

      // feature-client-getText should have Id from getText/en.json
      expect(output['feature-client-getText']).toEqual({
        'FeatureClientUser Id': 'FeatureClientUser Id',
      });

      // feature-client should have ALL keys from both en.json files
      // This is the key fix - previously it would only have data from one file
      expect(output['feature-client']).toEqual({
        'client feature transloco message': 'client feature transloco message',
        'FeatureClientUser Username': 'FeatureClientUser Username',
        'FeatureClientUser Password': 'FeatureClientUser Password',
        'FeatureClientUser Id': 'FeatureClientUser Id',
      });
    } finally {
      process.chdir(originalCwd);
    }
  });

  it(`GIVEN scopes with different path depths
      WHEN processed
      THEN narrower paths should be written first and wider scopes should include all data`, async () => {
    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await run({
        watch: false,
        skipGitIgnoreUpdate: true,
        rootTranslationsPath: './apps/client/src/assets/i18n/',
        scopedLibs: ['libs/feature/client'],
      });

      const outputPath = join(
        TEST_DIR,
        'apps/client/src/assets/i18n/en.vendor.json',
      );
      const output = JSON.parse(readFileSync(outputPath, 'utf-8'));

      // Both scopes should exist and not overwrite each other
      expect(Object.keys(output).length).toBe(2);
      expect(output['feature-client-getText']).toBeDefined();
      expect(output['feature-client']).toBeDefined();

      // The wide scope (feature-client) should include data from all files it found
      expect(Object.keys(output['feature-client']).length).toBe(4);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
