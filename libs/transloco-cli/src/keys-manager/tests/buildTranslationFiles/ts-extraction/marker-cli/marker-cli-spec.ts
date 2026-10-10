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

const { buildTranslationFiles } =
  await import('../../../../keys-builder/index.js');

export function testMarkerCliExtraction(fileFormat: Config['fileFormat']) {
  describe('marker imported from @jsverse/transloco-cli/marker', () => {
    const type: TranslationTestCase = 'ts-extraction/marker-cli';

    beforeEach(() => removeI18nFolder(type));

    it(`GIVEN files importing marker from the CLI's marker subpath, plain, aliased and with a scope
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
