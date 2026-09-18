import { describe, beforeEach, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { mockResolveProjectBasePath } from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testRouteTitleNoProviderExtraction(
  fileFormat: Config['fileFormat'],
) {
  describe('route title (provider not actually used)', () => {
    const type: TranslationTestCase = 'ts-extraction/route-title-no-provider';

    beforeEach(() => removeI18nFolder(type));

    it(`GIVEN provideTranslocoTitleStrategy() is only imported and mentioned
        in a comment, but never actually called
        WHEN keys are extracted
        THEN no route title keys are extracted`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      buildTranslationFiles(config);

      assertTranslation({ type, fileFormat, expected: {} });
    });
  });
}
