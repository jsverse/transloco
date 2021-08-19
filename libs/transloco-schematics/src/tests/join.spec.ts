import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
jest.mock('@ngneat/transloco-utils');
import {getGlobalConfig, TranslocoGlobalConfig} from '@ngneat/transloco-utils';
import * as path from 'path';
import { createWorkspace } from '../utils/create-workspace';
import en from './mocks/en';
import es from './mocks/es';
import scopeEn from './mocks/scope-en';
import scopeEs from './mocks/scope-es';

const collectionPath = path.join(__dirname, '../collection.json');

describe('Join', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  let appTree: UnitTestTree;
  const options = {
    translationPath: 'src/assets/i18n',
    outDir: 'dist-i18n'
  };

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
    appTree.create('src/assets/i18n/es.json', JSON.stringify(es));
    appTree.create('src/assets/i18n/en.json', JSON.stringify(en));
    const config: Partial<TranslocoGlobalConfig> = {defaultLang: 'en'};
    (getGlobalConfig as jest.Mock).mockReturnValue(config);
  });

  describe('default strategy', () => {
    beforeEach(() => {
      appTree.create('src/assets/i18n/scope/en.json', JSON.stringify(scopeEn));
      appTree.create('src/assets/i18n/scope/es.json', JSON.stringify(scopeEs));
    });

    it('should merge translation files to dist', async () => {
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });

    it('should merge scopes correctly', async () => {
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
      expect(tree.readContent('/dist-i18n/en.json')).toMatchSnapshot();
    });

    it('should delete output files on rerun', async () => {
      await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });

    it('should take default path', async () => {
      const tree = await schematicRunner.runSchematicAsync('join', {}, appTree).toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });

    it('should take default project path', async () => {
      const tree = await schematicRunner.runSchematicAsync('join', { project: 'bar' }, appTree).toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });
  });

  describe('scope map strategy', () => {
    function setup(scopePathMap: any = { scope: 'src/app/i18n' }) {
      Object.values(scopePathMap).forEach(path => {
        appTree.create(`${path}/en.json`, JSON.stringify(scopeEn));
        appTree.create(`${path}/es.json`, JSON.stringify(scopeEs));
      });
      (getGlobalConfig as jest.Mock).mockImplementation(() => ({ scopePathMap }));
    }

    it('should use scope map strategy', async () => {
      setup();
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
      expect(tree.readContent('/dist-i18n/en.json')).toMatchSnapshot();
    });

    it('should use scope map strategy multi scopes', async () => {
      const scopePathMap = {
        scopeA: 'src/app/i18n/scope1',
        scopeB: 'src/app/i18n/scope2'
      };
      setup(scopePathMap);
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
      expect(tree.readContent('/dist-i18n/en.json')).toMatchSnapshot();
    });

    it('should use multi projects scopes', async () => {
      const scopePathMap = {
        libA: 'projects/bar/assets/i18n',
        libB: 'projects/baz/assets/i18n'
      };
      setup(scopePathMap);
      const tree = await schematicRunner.runSchematicAsync('join', options, appTree).toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
      expect(tree.readContent('/dist-i18n/en.json')).toMatchSnapshot();
    });
  });
});
