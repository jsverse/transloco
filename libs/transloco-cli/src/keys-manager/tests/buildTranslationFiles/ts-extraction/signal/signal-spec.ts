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

export function testSignalExtraction(fileFormat: Config['fileFormat']) {
  describe('signal', () => {
    const type: TranslationTestCase = 'ts-extraction/signal';

    beforeEach(() => removeI18nFolder(type));

    it('should work with signals', () => {
      const config = buildConfig({ type, config: { fileFormat } });

      const expected = {
        username: defaultValue,
        password: defaultValue,
        title: defaultValue,
        username2: defaultValue,
        password2: defaultValue,
        title2: defaultValue,
        username3: defaultValue,
        password3: defaultValue,
        title3: defaultValue,
      };
      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
