import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils.js';
import {
  defaultValue,
  mockResolveProjectBasePath,
} from '../../../spec-utils.js';
import { Config } from '../../../../types.js';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } =
  await import('../../../../keys-builder/index.js');

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

    it(`GIVEN a marker key prefixed with a known scope alias and no scope argument
        WHEN keys are extracted
        THEN it's extracted into that scope's translation file, not the global one`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      buildTranslationFiles(config);

      assertTranslation({
        type,
        fileFormat,
        expected: { marker_with_alias_prefix: defaultValue },
        path: 'marker-prefixed/',
      });
    });
  });
}
