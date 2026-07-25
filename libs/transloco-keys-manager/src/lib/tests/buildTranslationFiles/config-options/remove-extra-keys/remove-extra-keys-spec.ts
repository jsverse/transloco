import nodePath from 'node:path';

import fs from 'fs-extra';
import { afterEach, beforeEach, describe, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { mockResolveProjectBasePath } from '../../../spec-utils';
import { Config, Translation } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testRemoveExtraKeysConfig(fileFormat: Config['fileFormat']) {
  describe('Remove extra keys', () => {
    const type: TranslationTestCase = 'config-options/remove-extra-keys';
    const basePath = nodePath.join('./', sourceRoot, type, 'src');
    const withKeyTpl = nodePath.join(basePath, '1-before.html.in');
    const missingKeyTpl = nodePath.join(basePath, '1-after.html.in');
    const testHtmlFile = nodePath.join(basePath, '1.html');

    beforeEach(() => removeI18nFolder(type));

    afterEach(() => fs.unlinkSync(testHtmlFile));

    interface RemoveKeysOptions {
      baseConfig: Config;
      expected: {
        before: Translation;
        deleted: Translation;
        skipDeletion: Translation;
      };
    }
    function testRemoveExtraKeys({ baseConfig, expected }: RemoveKeysOptions) {
      it('should remove unused keys when remove-extra-keys is true', () => {
        fs.copyFileSync(withKeyTpl, testHtmlFile);
        buildTranslationFiles({ ...baseConfig, removeExtraKeys: false });
        assertTranslation({ type, expected: expected.before, fileFormat });

        fs.copyFileSync(missingKeyTpl, testHtmlFile);
        buildTranslationFiles({ ...baseConfig, removeExtraKeys: true });
        assertTranslation({ type, expected: expected.deleted, fileFormat });
      });

      it('should keep unused keys when remove-extra-keys is false', () => {
        fs.copyFileSync(withKeyTpl, testHtmlFile);
        buildTranslationFiles({ ...baseConfig, removeExtraKeys: false });
        assertTranslation({ type, expected: expected.before, fileFormat });

        fs.copyFileSync(missingKeyTpl, testHtmlFile);
        buildTranslationFiles({ ...baseConfig, removeExtraKeys: false });
        assertTranslation({
          type,
          expected: expected.skipDeletion,
          fileFormat,
        });
      });
    }

    // Run with unflat = true to test the nested JSON structure.
    describe('with unflat = true', () => {
      const expectedBefore = {
        '1': 'missing',
        '2': 'missing',
        group1: { '1': 'missing', '2': 'missing' },
        group2: { '1': 'missing', '2': 'missing' },
      };
      const expectedDeleted = {
        '2': 'missing',
        group1: { '2': 'missing' },
        group3: { '2': 'missing' },
      };
      const expectedNoDeletion = {
        ...expectedBefore,
        group3: { '2': 'missing' },
      };

      const baseConfig = buildConfig({
        type: type,
        config: { unflat: true, fileFormat },
      });
      testRemoveExtraKeys({
        baseConfig,
        expected: {
          before: expectedBefore,
          deleted: expectedDeleted,
          skipDeletion: expectedNoDeletion,
        },
      });
    });

    // Run with unflat = false to test the flattened JSON structure.
    describe('with unflat = false', () => {
      const expectedBefore = {
        '1': 'missing',
        '2': 'missing',
        'group1.1': 'missing',
        'group1.2': 'missing',
        'group2.1': 'missing',
        'group2.2': 'missing',
      };
      const expectedDeleted = {
        '2': 'missing',
        'group1.2': 'missing',
        'group3.2': 'missing',
      };
      const expectedNoDeletion = {
        ...expectedBefore,
        'group3.2': 'missing',
      };

      const baseConfig = buildConfig({
        type,
        config: { unflat: false, fileFormat },
      });
      testRemoveExtraKeys({
        baseConfig,
        expected: {
          before: expectedBefore,
          deleted: expectedDeleted,
          skipDeletion: expectedNoDeletion,
        },
      });
    });
  });
}
