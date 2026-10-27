import { describe, beforeEach, it } from 'vitest';

import {
  assertPartialTranslation,
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils.js';
import {
  defaultValue,
  generateKeys,
  mockResolveProjectBasePath,
} from '../../../spec-utils.js';
import { Config } from '../../../../types.js';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } =
  await import('../../../../keys-builder/index.js');

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
          ...generateKeys({ end: 2, prefix: 'shadowing.outer' }),
          ...generateKeys({ end: 1, prefix: 'shadowing.inner' }),
          ...generateKeys({ end: 1, prefix: 'shadowing.template' }),
          ...generateKeys({ end: 3, prefix: 'shadowing.unprefixed' }),
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

    it(`GIVEN a nested transloco block that redeclares the outer variable without a prefix
        WHEN keys are extracted
        THEN its keys are extracted as written, without the outer block's prefix`, () => {
      buildTranslationFiles(config);

      assertPartialTranslation({
        type,
        expected: {
          'shadowing.outer.1': defaultValue,
          'shadowing.outer.2': defaultValue,
          ...generateKeys({ end: 3, prefix: 'shadowing.unprefixed' }),
        },
        fileFormat,
      });
    });

    it(`GIVEN a nested transloco block that redeclares the outer variable with its own prefix
        WHEN keys are extracted
        THEN only the inner block's prefix is applied`, () => {
      buildTranslationFiles(config);

      assertPartialTranslation({
        type,
        expected: {
          'shadowing.inner.1': defaultValue,
          'shadowing.template.1': defaultValue,
        },
        fileFormat,
      });
    });
  });
}
