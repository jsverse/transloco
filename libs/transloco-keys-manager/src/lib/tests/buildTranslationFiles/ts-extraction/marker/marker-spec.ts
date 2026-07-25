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

export function testMarkerExtraction(fileFormat: Config['fileFormat']) {
  describe('marker', () => {
    const type: TranslationTestCase = 'ts-extraction/marker';

    beforeEach(() => removeI18nFolder(type));

    it('should work with marker', () => {
      const config = buildConfig({ type, config: { fileFormat } });

      const expected = {
        username4: defaultValue,
        password4: defaultValue,
        username: defaultValue,
        password: defaultValue,
      };
      const expectedInScope = {
        marker_with_scope_username: defaultValue,
      };
      const expectedInNestedScope = {
        marker_with_scope_password: defaultValue,
      };

      buildTranslationFiles(config);

      assertTranslation({ type, fileFormat, expected });
      assertTranslation({
        type,
        fileFormat,
        expected: expectedInScope,
        path: 'scope/',
      });
      assertTranslation({
        type,
        fileFormat,
        expected: expectedInNestedScope,
        path: 'nested/scope/',
      });
    });
  });
}
