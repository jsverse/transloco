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

const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testMarkerMixedImportExtraction(
  fileFormat: Config['fileFormat'],
) {
  describe('marker imported next to other names from @jsverse/transloco', () => {
    const type: TranslationTestCase = 'ts-extraction/marker-mixed-import';

    beforeEach(() => removeI18nFolder(type));

    it(`GIVEN files importing marker in one declaration with other names, plain, aliased and with a scope
        WHEN keys are extracted
        THEN every marked key lands in its own scope's translation file`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      buildTranslationFiles(config);

      assertTranslation({
        type,
        fileFormat,
        expected: {
          username4: defaultValue,
          password4: defaultValue,
          username: defaultValue,
          password: defaultValue,
        },
      });
      assertTranslation({
        type,
        fileFormat,
        expected: { marker_with_scope_username: defaultValue },
        path: 'scope/',
      });
      assertTranslation({
        type,
        fileFormat,
        expected: { marker_with_scope_password: defaultValue },
        path: 'nested/scope/',
      });
    });
  });
}
