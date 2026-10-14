import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils.js';
import {
  defaultValue,
  mockResolveProjectBasePath,
} from '../../../spec-utils.js';
import { Config } from '../../../../types.js';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } =
  await import('../../../../keys-builder/index.js');

export function testUnflatExtraction(fileFormat: Config['fileFormat']) {
  describe('unflat', () => {
    const type: TranslationTestCase = 'config-options/unflat';
    const config = buildConfig({ type, config: { unflat: true, fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with unflat true', () => {
      const expected = {
        global: {
          a: {
            '1': defaultValue,
          },
        },
      };
      buildTranslationFiles(config);
      assertTranslation({ type, expected: expected.global, fileFormat });
    });
  });
}
