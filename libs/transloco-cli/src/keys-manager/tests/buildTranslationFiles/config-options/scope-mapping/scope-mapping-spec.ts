import { beforeEach, describe, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { generateKeys, mockResolveProjectBasePath } from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testScopeMappingConfig(fileFormat: Config['fileFormat']) {
  describe('Scope mapping', () => {
    const type: TranslationTestCase = 'config-options/scope-mapping';
    const config = buildConfig({
      type,
      config: {
        fileFormat,
        scopePathMap: {
          scope1: `./${sourceRoot}/${type}/i18n/scopes/mapped`,
        },
      },
    });

    beforeEach(() => removeI18nFolder(type));

    it('should work with scope mapping', () => {
      const expected = generateKeys({ end: 3 });
      buildTranslationFiles(config);
      assertTranslation({
        type,
        path: 'scopes/mapped/',
        expected,
        fileFormat,
      });
    });
  });
}
