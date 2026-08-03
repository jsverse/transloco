import { describe, beforeEach, it } from 'vitest';

import {
  assertPartialTranslation,
  assertTranslation,
  buildConfig,
  removeI18nFolder,
  sourceRoot,
  TranslationTestCase,
} from '../../build-translation-utils';
import {
  defaultValue,
  generateKeys,
  mockResolveProjectBasePath,
  buildKeysFromParams,
  paramsTestConfig,
} from '../../../spec-utils';
import { Config } from '../../../../types';

mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { buildTranslationFiles } = await import('../../../../keys-builder');

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
