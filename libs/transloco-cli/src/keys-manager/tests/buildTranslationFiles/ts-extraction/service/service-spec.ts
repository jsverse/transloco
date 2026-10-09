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
  buildKeysFromParams,
  paramsTestConfig,
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

export function testServiceExtraction(fileFormat: Config['fileFormat']) {
  describe('service', () => {
    const type: TranslationTestCase = 'ts-extraction/service';
    const config = buildConfig({ type, config: { fileFormat } });

    beforeEach(() => removeI18nFolder(type));

    it('should work with service', () => {
      const expected = {
        ...generateKeys({ end: 19 }),
        ...{ '20.21.22.23': defaultValue },
        ...generateKeys({ start: 24, end: 33 }),
        'inject.test': defaultValue,
        'private-class-field.test': defaultValue,
        'permission.snackbar.no-permission': defaultValue,
        'permission.snackbar.close': defaultValue,
        servicePrefixed: defaultValue,
      };

      buildTranslationFiles(config);
      assertTranslation({ type, expected, fileFormat });
    });

    it('should work with scopes', () => {
      const expected = {
        todos: {
          '1': defaultValue,
          '2.1': defaultValue,
        },
        admin: {
          '3.1': defaultValue,
          '4': defaultValue,
        },
        nested: {
          '5': defaultValue,
          '6.1': defaultValue,
        },
      };

      buildTranslationFiles(config);
      assertTranslation({
        type,
        expected: expected.todos,
        path: 'todos-page/',
        fileFormat,
      });
      assertTranslation({
        type,
        expected: expected.admin,
        path: 'admin-page/',
        fileFormat,
      });
      assertTranslation({
        type,
        expected: expected.nested,
        path: 'nested/scope/',
        fileFormat,
      });
    });

    it(`GIVEN a service key prefixed with a known scope alias and no scope argument
        WHEN keys are extracted
        THEN it's extracted into that scope's translation file, not the global one`, () => {
      buildTranslationFiles(config);

      assertTranslation({
        type,
        expected: {
          translate: defaultValue,
          'select-translate': defaultValue,
        },
        path: 'service-prefixed/',
        fileFormat,
      });
    });

    it(`GIVEN a service key equal to a known scope alias, with nothing after it
        WHEN keys are extracted
        THEN it stays a global key`, () => {
      buildTranslationFiles(config);

      assertPartialTranslation({
        type,
        expected: { servicePrefixed: defaultValue },
        fileFormat,
      });
    });

    it('should work when passing an array of keys', () => {
      const expected = generateKeys({ start: 26, end: 33 });

      buildTranslationFiles(config);
      assertPartialTranslation({ type, expected, fileFormat });
    });

    it('should extract params', () => {
      const expected = {
        ...generateKeys({ end: 11, withParams: true }),
        ...buildKeysFromParams([
          'inject.test',
          'private-class-field.test',
          'variable',
          'another.variable',
        ]),
      };

      buildTranslationFiles(paramsTestConfig(config));
      assertTranslation({ type, expected, fileFormat });
    });
  });
}
