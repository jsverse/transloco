import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { TranslocoGlobalConfig } from '@ngneat/transloco-utils';

import { createWorkspace } from './create-workspace';
import en from './mocks/en';
import es from './mocks/es';
import scopeEn from './mocks/scope-en';
import scopeEs from './mocks/scope-es';

jest.mock('../utils/config');
// eslint-disable-next-line import/order
import { getConfig } from '../utils/config';

const collectionPath = path.join(__dirname, '../collection.json');

describe('Join', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  let appTree: UnitTestTree;
  const globalConfig: Partial<TranslocoGlobalConfig> = { defaultLang: 'en' };
  const options = {
    translationPath: './src/assets/i18n',
    outDir: 'dist-i18n',
  };

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner);
    appTree.create('src/assets/i18n/es.json', JSON.stringify(es));
    appTree.create('src/assets/i18n/en.json', JSON.stringify(en));
    (getConfig as jest.Mock).mockReturnValue(globalConfig);
  });

  describe('default strategy', () => {
    beforeEach(() => {
      appTree.create('src/assets/i18n/scope/en.json', JSON.stringify(scopeEn));
      appTree.create('src/assets/i18n/scope/es.json', JSON.stringify(scopeEs));
    });

    it('should merge translation files that are not the default language to dist', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
      expect(tree.files).not.toEqual(['/dist-i18n/en.json']);
    });

    it('should merge translation files including the default language to dist', async () => {
      const tree = await schematicRunner
        .runSchematicAsync(
          'join',
          { ...options, includeDefaultLang: true },
          appTree
        )
        .toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });

    it('should merge scopes correctly', async () => {
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it('should delete output file and pass on rerun', async () => {
      // first run.
      await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();
      // second run.
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });

    it(`should take default project's path`, async () => {
      appTree.create(
        'projects/bar/src/assets/i18n/en.json',
        JSON.stringify(scopeEn)
      );
      appTree.create(
        'projects/bar/src/assets/i18n/es.json',
        JSON.stringify(scopeEs)
      );

      const tree = await schematicRunner
        .runSchematicAsync('join', {}, appTree)
        .toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });

    it('should take specific project path', async () => {
      appTree.create(
        'projects/baz/src/assets/i18n/en.json',
        JSON.stringify(scopeEn)
      );
      appTree.create(
        'projects/baz/src/assets/i18n/es.json',
        JSON.stringify(scopeEs)
      );

      const tree = await schematicRunner
        .runSchematicAsync('join', { project: 'baz' }, appTree)
        .toPromise();
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });
  });

  describe('scope map strategy', () => {
    function setup(scopePathMap: any = { scope: 'src/app/assets/i18n' }) {
      Object.values(scopePathMap).forEach((path) => {
        appTree.create(`${path}/en.json`, JSON.stringify(scopeEn));
        appTree.create(`${path}/es.json`, JSON.stringify(scopeEs));
      });

      (getConfig as jest.Mock).mockReturnValue({
        ...globalConfig,
        scopePathMap,
      });
    }

    it('should use scope map strategy', async () => {
      setup();
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();
      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it('should use scope map strategy multi scopes', async () => {
      const scopePathMap = {
        scopeA: 'src/app/assets/i18n/scope1',
        scopeB: 'src/app/assets/i18n/scope2',
      };
      setup(scopePathMap);
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it('should use multi projects scopes', async () => {
      const scopePathMap = {
        libA: 'projects/bar/src/assets/i18n',
        libB: 'projects/baz/src/assets/i18n',
      };
      setup(scopePathMap);
      const tree = await schematicRunner
        .runSchematicAsync('join', options, appTree)
        .toPromise();

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });
  });
});
