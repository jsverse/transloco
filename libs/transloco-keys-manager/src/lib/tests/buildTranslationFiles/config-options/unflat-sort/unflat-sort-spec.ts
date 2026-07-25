import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { defaultValue, mockResolveProjectBasePath } from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testUnflatSortExtraction(fileFormat: Config['fileFormat']) {
  describe('unflat-sort', () => {
    const type: TranslationTestCase = 'config-options/unflat-sort';
    const config = buildConfig({
      type,
      config: { unflat: true, sort: true, fileFormat },
    });

    beforeEach(() => removeI18nFolder(type));

    it('should work with unflat and sort true', () => {
      const expected = {
        global: {
          b: {
            b: {
              a: defaultValue,
              b: defaultValue,
            },
            c: {
              a: defaultValue,
              p: defaultValue,
              x: defaultValue,
            },
          },
        },
      };
      buildTranslationFiles(config);
      assertTranslation({ type, expected: expected.global, fileFormat });
    });
  });
}
