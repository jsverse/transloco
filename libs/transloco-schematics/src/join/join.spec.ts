import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

jest.mock('../../schematics-core/utils/transloco');
import { getGlobalConfig } from '../../schematics-core';
import {
  createWorkspace,
  translationMocks,
} from '../../schematics-core/testing';

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
    appTree.create(
      'src/assets/i18n/es.json',
      JSON.stringify(translationMocks.es),
    );
    appTree.create(
      'src/assets/i18n/en.json',
      JSON.stringify(translationMocks.en),
    );
    (getGlobalConfig as jest.Mock).mockReturnValue(globalConfig);
  });

  describe('default strategy', () => {
    beforeEach(() => {
      appTree.create(
        'src/assets/i18n/scope/en.json',
        JSON.stringify(translationMocks.scopeEn),
      );
      appTree.create(
        'src/assets/i18n/scope/es.json',
        JSON.stringify(translationMocks.scopeEs),
      );
    });

    it(`GIVEN translation files in default and non-default languages
        WHEN join schematic runs without includeDefaultLang option
        THEN only non-default language files are merged to dist`, async () => {
      const tree = await schematicRunner.runSchematic('join', options, appTree);
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
      expect(tree.files).not.toEqual(['/dist-i18n/en.json']);
    });

    it(`GIVEN translation files in default and non-default languages
        WHEN join schematic runs with includeDefaultLang option enabled
        THEN all language files including default are merged to dist`, async () => {
      const tree = await schematicRunner.runSchematic(
        'join',
        { ...options, includeDefaultLang: true },
        appTree,
      );
      expect(tree.files).toEqual(['/dist-i18n/es.json', '/dist-i18n/en.json']);
    });

    it(`GIVEN translation files with nested scopes
        WHEN join schematic runs
        THEN scoped translations are correctly merged into single files`, async () => {
      const tree = await schematicRunner.runSchematic('join', options, appTree);

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it(`GIVEN join schematic has been run once
        WHEN join schematic runs a second time
        THEN output files are deleted and regenerated successfully`, async () => {
      // first run.
      await schematicRunner.runSchematic('join', options, appTree);
      // second run.
      const tree = await schematicRunner.runSchematic('join', options, appTree);
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });

    it(`GIVEN translation files in default project path
        WHEN join schematic runs without project option
        THEN translations are merged from default project path`, async () => {
      appTree.create(
        'projects/bar/src/assets/i18n/en.json',
        JSON.stringify(translationMocks.scopeEn),
      );
      appTree.create(
        'projects/bar/src/assets/i18n/es.json',
        JSON.stringify(translationMocks.scopeEs),
      );

      const tree = await schematicRunner.runSchematic('join', {}, appTree);
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });

    it(`GIVEN translation files in specific project path
        WHEN join schematic runs with project option set to 'baz'
        THEN translations are merged from specified project path`, async () => {
      appTree.create(
        'projects/baz/src/assets/i18n/en.json',
        JSON.stringify(translationMocks.scopeEn),
      );
      appTree.create(
        'projects/baz/src/assets/i18n/es.json',
        JSON.stringify(translationMocks.scopeEs),
      );

      const tree = await schematicRunner.runSchematic(
        'join',
        { project: 'baz' },
        appTree,
      );
      expect(tree.files).toEqual(['/dist-i18n/es.json']);
    });
  });

  describe('scope map strategy', () => {
    function setup(scopePathMap: any = { scope: 'src/app/assets/i18n' }) {
      Object.values(scopePathMap).forEach((path) => {
        appTree.create(
          `${path}/en.json`,
          JSON.stringify(translationMocks.scopeEn),
        );
        appTree.create(
          `${path}/es.json`,
          JSON.stringify(translationMocks.scopeEs),
        );
      });

      (getGlobalConfig as jest.Mock).mockReturnValue({
        ...globalConfig,
        scopePathMap,
      });
    }

    it(`GIVEN global config with scopePathMap configured
        WHEN join schematic runs
        THEN translations are merged using scope map strategy`, async () => {
      setup();
      const tree = await schematicRunner.runSchematic('join', options, appTree);
      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it(`GIVEN global config with multiple scopes in scopePathMap
        WHEN join schematic runs
        THEN all scopes are merged correctly using scope map strategy`, async () => {
      const scopePathMap = {
        scopeA: 'src/app/assets/i18n/scope1',
        scopeB: 'src/app/assets/i18n/scope2',
      };
      setup(scopePathMap);
      const tree = await schematicRunner.runSchematic('join', options, appTree);

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });

    it(`GIVEN global config with scopePathMap spanning multiple projects
        WHEN join schematic runs
        THEN translations from all projects are merged correctly`, async () => {
      const scopePathMap = {
        libA: 'projects/bar/src/assets/i18n',
        libB: 'projects/baz/src/assets/i18n',
      };
      setup(scopePathMap);
      const tree = await schematicRunner.runSchematic('join', options, appTree);

      expect(tree.readContent('/dist-i18n/es.json')).toMatchSnapshot();
    });
  });
});
