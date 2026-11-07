import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import {
  defaultValue,
  generateKeys,
  mockResolveProjectBasePath,
} from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testInlineTemplateExtraction(fileFormat: Config['fileFormat']) {
  describe('inline template', () => {
    const type: TranslationTestCase = 'ts-extraction/inline-template';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with inline templates', () => {
      const expected = generateKeys({ end: 25 });
      ['Processing archive...', 'Restore Options'].forEach((nonNumericKey) => {
        expected[nonNumericKey] = defaultValue;
      });
      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
