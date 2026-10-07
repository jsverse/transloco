import { describe, beforeEach, it } from 'vitest';
import * as angularCompiler from '@angular/compiler';

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

const { buildTranslationFiles } = await import('../../../../keys-builder');

/** `@boundary`/`@error` blocks only parse on Angular versions that ship them (22.2+). */
const supportsBoundaryBlock = 'TmplAstBoundaryBlock' in angularCompiler;

export function testBoundaryExtraction(fileFormat: Config['fileFormat']) {
  describe('Boundary block', () => {
    const type: TranslationTestCase = 'template-extraction/boundary';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it.skipIf(!supportsBoundaryBlock)(
      'should extract keys from @boundary and @error blocks',
      () => {
        const expected = generateKeys({ end: 8 });
        buildTranslationFiles(config);
        assertTranslation({ type, expected, fileFormat });
      },
    );
  });
}
