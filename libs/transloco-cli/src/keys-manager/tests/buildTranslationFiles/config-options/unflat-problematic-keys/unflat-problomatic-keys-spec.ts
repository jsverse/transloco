import { beforeEach, describe, it, vi, afterEach, expect } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import { defaultValue, mockResolveProjectBasePath } from '../../../spec-utils';
import { Config } from '../../../../types';
import { messages } from '../../../../messages';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testUnflatProblomaticKeysConfig(
  fileFormat: Config['fileFormat'],
) {
  describe('Unflat problematic keys', () => {
    const type: TranslationTestCase = 'config-options/unflat-problematic-keys';
    const config = buildConfig({ type, config: { unflat: true, fileFormat } });
    const spy = vi.spyOn(messages, 'problematicKeysForUnflat');

    beforeEach(() => {
      spy.mockReset();
      removeI18nFolder(type);
    });

    it('should work with unflat true and problematic keys', () => {
      const expected = {
        global: {
          a: defaultValue,
          b: defaultValue,
          c: defaultValue,
          d: {
            '1': defaultValue,
            '2': defaultValue,
          },
          e: {
            a: defaultValue,
            aa: defaultValue,
          },
          f: defaultValue,
        },
      };
      const expectedProblematicKeys = [
        'a',
        'a.b',
        'a.c',
        'b',
        'b.a',
        'b.b',
        'f',
        'f.a',
        'f.a.a',
        'f.a.b',
        'f.b',
        'f.b.a.a',
      ];

      buildTranslationFiles(config);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expectedProblematicKeys);
      assertTranslation({ type, expected: expected.global, fileFormat });
    });

    afterEach(() => {
      spy.mockReset();
    });
  });
}
