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
  resolveValueWithParams,
  paramsTestConfig,
} from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testDirectiveExtraction(fileFormat: Config['fileFormat']) {
  describe('Directive', () => {
    const type: TranslationTestCase = 'template-extraction/directive';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with directive', () => {
      const expected = generateKeys({ end: 24 });
      ['Processing archive...', 'Restore Options'].forEach((nonNumericKey) => {
        expected[nonNumericKey] = defaultValue;
      });
      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });

    it('should extract params', () => {
      const expected = {
        ...generateKeys({ end: 3, withParams: true }),
        ...generateKeys({ start: 4, end: 5 }),
        'admin.key': resolveValueWithParams(['a', 'b.c', 'b.d.e', 'b.f']),
      };
      buildTranslationFiles(paramsTestConfig(config));
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
