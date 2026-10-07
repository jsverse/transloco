import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import {
  generateKeys,
  mockResolveProjectBasePath,
  paramsTestConfig,
  resolveValueWithParams,
} from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testPureFunctionExtraction(fileFormat: Config['fileFormat']) {
  describe('pure-function', () => {
    const type: TranslationTestCase = 'ts-extraction/pure-function';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with the pure `translate` function', () => {
      const expected = generateKeys({ end: 4 });

      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });

    it('should extract params', () => {
      const expected = {
        ...generateKeys({ end: 3, withParams: true }),
        4: resolveValueWithParams(['foo', 'a', 'b.c']),
      };

      buildTranslationFiles(paramsTestConfig(config));
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
