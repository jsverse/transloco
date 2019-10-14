import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import mock = jest.mock;
mock('@ngneat/transloco-utils');
import { getConfig } from '@ngneat/transloco-utils';
import * as path from 'path';
import { createWorkspace } from '../utils/create-workspace';
import scopeEn from './mocks/scope-en';
import scopeEs from './mocks/scope-es';

const collectionPath = path.join(__dirname, '../collection.json');

describe('Spill', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  let appTree: UnitTestTree;
  const options = {
    translationPath: 'src/assets/i18n',
    source: 'dist-i18n'
  };

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
  });

  function setupMerged(enScopeMock, esScopeMock) {
    appTree.create(`${options.source}/es.json`, JSON.stringify(esScopeMock));
    appTree.create(`${options.source}/en.json`, JSON.stringify(enScopeMock));
  }

  describe('default strategy', () => {
    it('should spill translated root content', async () => {
      const translatedEn = { hello: 'hello translated' };
      const translatedEs = { hello: 'hola translated' };
      setupMerged(translatedEn, translatedEs);
      appTree.create(`${options.translationPath}/en.json`, '');
      appTree.create(`${options.translationPath}/es.json`, '');

      const tree = await schematicRunner.runSchematicAsync('spill', options, appTree).toPromise();
      const resES = JSON.parse(tree.readContent(`${options.translationPath}/es.json`));
      const resEn = JSON.parse(tree.readContent(`${options.translationPath}/en.json`));
      expect(resES).toEqual(translatedEs);
      expect(resEn).toEqual(translatedEn);
    });

    it('should spill translated scope content', async () => {
      const translatedEn = { scope: { hello: 'hello translated' } };
      const translatedEs = { scope: { hello: 'hola translated' } };
      setupMerged(translatedEn, translatedEs);
      appTree.create(`${options.translationPath}/scope/en.json`, '');
      appTree.create(`${options.translationPath}/scope/es.json`, '');

      const tree = await schematicRunner.runSchematicAsync('spill', options, appTree).toPromise();

      const resES = JSON.parse(tree.readContent(`${options.translationPath}/scope/es.json`));
      const resEn = JSON.parse(tree.readContent(`${options.translationPath}/scope/en.json`));
      expect(resES).toEqual(translatedEs.scope);
      expect(resEn).toEqual(translatedEn.scope);
    });
  });

  describe('scope map strategy', () => {
    function setupFiles(scopePathMap: any = { scope: 'src/app/i18n' }) {
      Object.values(scopePathMap).forEach(path => {
        appTree.create(`${path}/en.json`, JSON.stringify(scopeEn));
        appTree.create(`${path}/es.json`, JSON.stringify(scopeEs));
      });
      (getConfig as jest.Mock).mockImplementation(() => ({ scopePathMap }));
    }

    it('should use scope map strategy', async () => {
      const translatedEn = { scope: { hello: 'hello translated' } };
      const translatedEs = { scope: { hello: 'hola translated' } };
      setupMerged(translatedEn, translatedEs);
      setupFiles({ scope: 'src/app/i18n' });

      const tree = await schematicRunner.runSchematicAsync('spill', options, appTree).toPromise();

      const resES = JSON.parse(tree.readContent('src/app/i18n/es.json'));
      const resEn = JSON.parse(tree.readContent('src/app/i18n/en.json'));
      expect(resES).toEqual(translatedEs.scope);
      expect(resEn).toEqual(translatedEn.scope);
    });
  });
});
