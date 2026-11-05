import { beforeEach, describe, it } from 'vitest';

import {
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../build-translation-utils';
import {
  defaultValue,
  generateKeys,
  mockResolveProjectBasePath,
} from '../../spec-utils';
import { Config } from '../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../keys-builder');

export function testCommentsExtraction(fileFormat: Config['fileFormat']) {
  describe('comments', () => {
    const type: TranslationTestCase = 'comments';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with comments', () => {
      const expected = {
        global: {
          'a.some.key': defaultValue,
          'b.some.key': defaultValue,
          'c.some.key': defaultValue,
          'prefix_c.some.key': defaultValue,
          'need.transloco': defaultValue,
          '1.some': defaultValue,
          ...generateKeys({ end: 8 }),
          '10': defaultValue,
          '13': defaultValue,
          '11.12': defaultValue,
          'hey.man': defaultValue,
          'whats.app': defaultValue,
          '101': defaultValue,
          '111.12': defaultValue,
          hello: defaultValue,
          'hey1.man': defaultValue,
          'whats1.app': defaultValue,
          hello1: defaultValue,
          '131': defaultValue,
          ...generateKeys({ end: 5, prefix: '10' }),
          '10.6.7': defaultValue,
          '11': defaultValue,
          '11.1': defaultValue,
          '11.2.3': defaultValue,
          '200': defaultValue,
          '201': defaultValue,
          '202': defaultValue,
          '203.204': defaultValue,
          '205': defaultValue,
          '206': defaultValue,
          '207.208': defaultValue,
          '209': defaultValue,
          '210': defaultValue,
          '211': defaultValue,
          '212': defaultValue,
          '213.214': defaultValue,
          '215': defaultValue,
          '216': defaultValue,
          '217.218': defaultValue,
          'from.comment': defaultValue,
          'pretty.cool.da': defaultValue,
          'early.exit.comment.key': defaultValue,
          ...generateKeys({ end: 4, prefix: 'global' }),
          ...generateKeys({ end: 8, prefix: 'outer.read' }),
          ...generateKeys({ end: 4, prefix: 'inner.read' }),
          ...generateKeys({ end: 2, prefix: 'another.container' }),
        },
        admin: {
          '1': defaultValue,
          '2.3': defaultValue,
          '4': defaultValue,
          '5555': defaultValue,
        },
      };
      buildTranslationFiles(config);

      assertTranslation({ type, expected: expected.global, fileFormat });
      assertTranslation({
        type,
        expected: expected.admin,
        path: 'admin/',
        fileFormat,
      });
    });
  });
}
