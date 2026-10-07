import { describe, beforeEach, it } from 'vitest';

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

export function testScopeExtraction(fileFormat: Config['fileFormat']) {
  describe('scope', () => {
    const type: TranslationTestCase = 'template-extraction/scope';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with scope', () => {
      const scopes = Array.from(Array(9), (_, index) => `scope${index + 1}`);

      const expected: Record<string, ReturnType<typeof generateKeys>> = {};
      for (const scope of scopes) {
        expected[scope] = generateKeys({ end: 1 });
      }

      buildTranslationFiles(config);
      scopes.forEach((scope) => {
        assertTranslation({
          type,
          expected: expected[scope],
          path: `${scope}/`,
          fileFormat,
        });
      });
    });
  });
}
