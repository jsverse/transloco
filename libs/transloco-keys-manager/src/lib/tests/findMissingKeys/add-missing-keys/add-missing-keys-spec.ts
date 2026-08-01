import nodePath from 'node:path';

import fs from 'fs-extra';
import { unflatten } from 'flat';
import { describe, beforeEach, it } from 'vitest';

import { Config } from '../../../types';
import {
  defaultValue,
  mockResolveProjectBasePath,
  buildConfig,
  assertTranslation,
  removeI18nFolder,
} from '../../spec-utils';

const sourceRoot =
  'libs/transloco-keys-manager/src/lib/tests/findMissingKeys/add-missing-keys';
mockResolveProjectBasePath(sourceRoot);

/**
 * With ESM modules, you need to mock the modules beforehand (with jest.unstable_mockModule) and import them ashynchronously afterwards.
 * This thing is still in WIP at Jest, so keep an eye on it.
 * @see https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
 */
const { findMissingKeys } = await import('../../../keys-detective');

const missingJson = {
  '1': defaultValue,
  'a.b': defaultValue,
  '5': defaultValue,
};

const expectedJson = {
  ...missingJson,
  'c.d': defaultValue,
  '4': defaultValue,
};

export function testAddMissingKeysConfig(
  fileFormat: Config['fileFormat'] = 'json',
) {
  describe('Add Missing Keys', () => {
    const config = buildConfig({
      config: {
        fileFormat,
        addMissingKeys: true,
      },
      sourceRoot,
    });
    const translationPath = nodePath.join(sourceRoot, 'i18n', 'en.json');

    beforeEach(() => removeI18nFolder(sourceRoot));

    it('should add missing keys to translation', () => {
      fs.ensureFileSync(translationPath);
      fs.writeFileSync(translationPath, JSON.stringify(missingJson));
      findMissingKeys(config);
      assertTranslation({
        expected: expectedJson,
        fileFormat,
        root: sourceRoot,
      });
    });

    it('should respect unflat option', () => {
      fs.ensureFileSync(translationPath);
      fs.writeFileSync(translationPath, JSON.stringify(unflatten(missingJson)));
      findMissingKeys({ ...config, unflat: true });
      assertTranslation({
        expected: unflatten(expectedJson),
        fileFormat,
        root: sourceRoot,
      });
    });
  });
}
