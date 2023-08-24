import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
jest.mock('@ngneat/transloco-utils');
import {
  getGlobalConfig,
  TranslocoGlobalConfig,
} from '@ngneat/transloco-utils';

import { createWorkspace } from './create-workspace';
import scopeEn from './mocks/scope-en';
import scopeEs from './mocks/scope-es';

const collectionPath = path.join(__dirname, '../collection.json');

describe('Split', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  let appTree: UnitTestTree;
  const options = {
    translationPath: 'src/assets/i18n',
    source: 'dist-i18n',
  };

  function readTranslation(
    tree: UnitTestTree,
    fileName: string,
    prefix = options.translationPath
  ) {
    return JSON.parse(tree.readContent(`${prefix}/${fileName}.json`));
  }

  function mockConfig(config: Partial<TranslocoGlobalConfig> = {}) {
    (getGlobalConfig as jest.Mock).mockReturnValue(config);
  }

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner);
    mockConfig();
  });

  function setupMerged(enScopeMock, esScopeMock) {
    appTree.create(`${options.source}/es.json`, JSON.stringify(esScopeMock));
    appTree.create(`${options.source}/en.json`, JSON.stringify(enScopeMock));
  }

  describe('default strategy', () => {
    it('should split translated root content', async () => {
      const translatedEn = { hello: 'hello translated' };
      const translatedEs = { hello: 'hola translated' };
      setupMerged(translatedEn, translatedEs);
      appTree.create(`${options.translationPath}/en.json`, '');
      appTree.create(`${options.translationPath}/es.json`, '');

      const tree = await schematicRunner
        .runSchematicAsync('split', options, appTree)
        .toPromise();

      const resES = readTranslation(tree, 'es');
      const resEn = readTranslation(tree, 'en');
      expect(resES).toEqual(translatedEs);
      expect(resEn).toEqual(translatedEn);
    });

    it('should split translated scope content', async () => {
      const translatedEn = { scope: { hello: 'hello translated', subscope: { sun: "sun translated" } } };
      const translatedEs = { scope: { hello: 'hola translated', subscope: { sun: "sol translated" } } };
      setupMerged(translatedEn, translatedEs);
      appTree.create(`${options.translationPath}/scope/en.json`, '');
      appTree.create(`${options.translationPath}/scope/es.json`, '');
      appTree.create(`${options.translationPath}/scope/subscope/en.json`, '');
      appTree.create(`${options.translationPath}/scope/subscope/es.json`, '');

      const tree = await schematicRunner
        .runSchematicAsync('split', options, appTree)
        .toPromise();

      const resES = readTranslation(tree, 'scope/es');
      const resEn = readTranslation(tree, 'scope/en');
      const resESSub = readTranslation(tree, 'scope/subscope/es');
      const resEnSub = readTranslation(tree, 'scope/subscope/en');
      expect(resES).toEqual(translatedEs.scope);
      expect(resEn).toEqual(translatedEn.scope);
      expect(resESSub).toEqual(translatedEs.scope.subscope);
      expect(resEnSub).toEqual(translatedEn.scope.subscope);
    });
  });

  describe('scope map strategy', () => {
    it('should use scope map strategy', async () => {
      const translatedEn = { scope: { hello: 'hello translated' } };
      const translatedEs = { scope: { hello: 'hola translated' } };
      setupMerged(translatedEn, translatedEs);
      const scope = `${options.translationPath}/scope`;
      const scopePathMap = { scope };
      mockConfig({ scopePathMap });
      appTree.create(`${scope}/en.json`, JSON.stringify(scopeEn));
      appTree.create(`${scope}/es.json`, JSON.stringify(scopeEs));
      const tree = await schematicRunner
        .runSchematicAsync('split', options, appTree)
        .toPromise();

      const resES = readTranslation(tree, 'es', scope);
      const resEn = readTranslation(tree, 'en', scope);
      expect(resES).toEqual(translatedEs.scope);
      expect(resEn).toEqual(translatedEn.scope);
    });
  });
});
