import { describe, beforeEach, it } from 'vitest';

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

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

export function testPrefixExtraction(fileFormat: Config['fileFormat']) {
  describe('prefix', () => {
    const type: TranslationTestCase = 'template-extraction/prefix';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with legacy read', () => {
      const expected = {
        global: {
          ...generateKeys({ end: 3 }),
          ...generateKeys({
            end: 23,
            prefix: 'site-header.navigation.route',
          }),
          ...generateKeys({ end: 5, prefix: 'site-header.navigation' }),
          ...generateKeys({ end: 10, prefix: 'right-pane.actions' }),
          ...generateKeys({ end: 1, prefix: 'templates.translations' }),
          ...generateKeys({ end: 3, prefix: 'nested.translation' }),
          ...generateKeys({
            end: 3,
            prefix: 'some.other.nested.that-is-tested',
          }),
          ...generateKeys({ end: 12, prefix: 'ternary.nested' }),
          ...generateKeys({ end: 2, prefix: 'nested' }),
          ...generateKeys({
            end: 2,
            prefix: 'site-header.navigation.route.nested',
          }),
        },
        todos: {
          ...generateKeys({ end: 2, prefix: 'numbers' }),
        },
      };

      buildTranslationFiles(config);
      assertTranslation({ type, expected: expected.global, fileFormat });
      assertTranslation({
        type,
        expected: expected.todos,
        path: 'todos-page/',
        fileFormat,
      });
    });
  });
}
