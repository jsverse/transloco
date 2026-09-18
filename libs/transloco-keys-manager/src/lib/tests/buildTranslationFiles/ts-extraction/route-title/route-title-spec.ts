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

export function testRouteTitleExtraction(fileFormat: Config['fileFormat']) {
  describe('route title', () => {
    const type: TranslationTestCase = 'ts-extraction/route-title';

    beforeEach(() => removeI18nFolder(type));

    it(`should extract plain-string route titles when provideTranslocoTitleStrategy is used,
        without a ResolveFn title, an empty title, or a non-Route path+title object`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      const expected = {
        'app.menu.design_system': defaultValue,
        'app.menu.settings': defaultValue,
        'app.menu.matched_route': defaultValue,
      };

      buildTranslationFiles(config);

      assertTranslation({ type, fileFormat, expected });
    });

    it(`GIVEN a route title wrapped in marker() with a scope argument
        WHEN keys are extracted
        THEN it's extracted once, into that scope's translation file, with no
             duplication/conflict from the (skipped) route title extractor`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      buildTranslationFiles(config);

      assertTranslation({
        type,
        fileFormat,
        expected: { title: defaultValue },
        path: 'admin/',
      });
    });
  });
}
