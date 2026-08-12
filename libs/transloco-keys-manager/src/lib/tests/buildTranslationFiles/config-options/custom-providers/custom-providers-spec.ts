import { beforeEach, describe, it } from 'vitest';

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

export function testCustomProvidersConfig(fileFormat: Config['fileFormat']) {
  describe('Custom scope providers and services', () => {
    const type: TranslationTestCase = 'config-options/custom-providers';
    const config = buildConfig({
      type,
      config: {
        fileFormat,
        scopeProviderFunctions: ['provideScopedTranslations'],
        serviceNames: ['TranslationsService'],
      },
    });

    beforeEach(() => removeI18nFolder(type));

    it('should extract keys from custom services without a transloco import', () => {
      const expected = {
        'custom-service.inject': defaultValue,
        'custom-service.constructor': defaultValue,
      };

      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });

    it('should resolve scopes provided by custom scope provider functions', () => {
      buildTranslationFiles(config);
      assertTranslation({
        type,
        expected: { '1': defaultValue },
        path: 'custom-page/',
        fileFormat,
      });
      assertTranslation({
        type,
        expected: { '2': defaultValue },
        path: 'other-page/',
        fileFormat,
      });
    });
  });
}
