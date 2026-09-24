import nodePath from 'node:path';

import { flatten } from 'flat';
import fs from 'fs-extra';
import { describe, beforeEach, expect, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { defaultValue, mockResolveProjectBasePath } from '../../../spec-utils';
import { Config } from '../../../../types';
import { getCurrentTranslation } from '../../../../keys-builder/utils/get-current-translation';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testUnflatSortExtraction(fileFormat: Config['fileFormat']) {
  describe('unflat-sort', () => {
    const type: TranslationTestCase = 'config-options/unflat-sort';
    const config = buildConfig({
      type,
      config: { unflat: true, sort: true, fileFormat },
    });

    beforeEach(() => removeI18nFolder(type));

    it('should work with unflat and sort true', () => {
      const expected = {
        global: {
          b: {
            b: {
              a: defaultValue,
              b: defaultValue,
            },
            c: {
              a: defaultValue,
              p: defaultValue,
              x: defaultValue,
            },
          },
        },
      };
      buildTranslationFiles(config);
      assertTranslation({ type, expected: expected.global, fileFormat });
    });

    it('should write the keys in sorted order', () => {
      buildTranslationFiles(config);
      const path = nodePath.join(sourceRoot, type, 'i18n', `en.${fileFormat}`);
      // Read the pot msgids straight from the file: parsing it into an
      // object would hide a wrong order
      const keys =
        fileFormat === 'pot'
          ? Array.from(
              fs.readFileSync(path, 'utf8').matchAll(/^msgid "(.+)"$/gm),
              ([, msgid]) => msgid,
            )
          : Object.keys(flatten(getCurrentTranslation({ path, fileFormat })));

      expect(keys).toEqual(['b.b.a', 'b.b.b', 'b.c.a', 'b.c.p', 'b.c.x']);
    });
  });
}
