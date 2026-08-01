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

export function testNgContainerExtraction(fileFormat: Config['fileFormat']) {
  describe('ng-container', () => {
    const type: TranslationTestCase = 'template-extraction/ng-container';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with ngContainer', () => {
      const expected = generateKeys({ end: 46 });
      // See https://github.com/ngneat/transloco-keys-manager/issues/87
      expected["Bob's Burgers"] =
        expected['another(test)'] =
        expected['last "one"'] =
          defaultValue;
      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });

    it('should work with scopes', () => {
      const expected = {
        '1': defaultValue,
        '2.1': defaultValue,
        '3.1': defaultValue,
        '4': defaultValue,
        '5': defaultValue,
      };

      buildTranslationFiles(config);
      assertTranslation({
        type,
        expected,
        path: 'admin-page/',
        fileFormat,
      });
    });

    it('should extract params', () => {
      const expected = {
        ...generateKeys({
          end: 7,
          withParams: true,
        }),
        ...generateKeys({ start: 8, end: 11 }),
        nested: resolveValueWithParams(['a', 'b.c.d']),
        'skip.params': defaultValue,
      };
      buildTranslationFiles(paramsTestConfig(config));
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
