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

    it(`GIVEN provideTranslocoTitleStrategy is used and routes declare plain-string titles,
        including loadChildren-shaped ones, next to a ResolveFn title, an empty title,
        a non-Route path+title object and a parent that only qualifies via a child route
        WHEN keys are extracted
        THEN only the plain-string Route titles are extracted`, () => {
      const config = buildConfig({ type, config: { fileFormat } });

      const expected = {
        'app.menu.design_system': defaultValue,
        'app.menu.settings': defaultValue,
        'app.menu.matched_route': defaultValue,
        'app.menu.nested': defaultValue,
        'app.menu.reports': defaultValue,
        'app.menu.reports_summary': defaultValue,
      };

      buildTranslationFiles(config);

      assertTranslation({ type, fileFormat, expected });
    });

    it(`GIVEN a route title prefixed with a known scope alias
        WHEN keys are extracted
        THEN it's extracted into that scope's translation file, not the global one`, () => {
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
