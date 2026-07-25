import { createRequire } from 'node:module';
import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import type { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

import {
  createWorkspace,
  translationMocks,
} from '../../schematics-core/testing';

// SchematicTestRunner loads schematic factories with @angular-devkit's own raw
// Node `require`, i.e. OUTSIDE Vitest's module registry. `vi.mock(...)` only
// intercepts modules loaded through Vitest, so it cannot reach the
// `getGlobalConfig` that the schematic itself calls. Instead we reach into the
// exact same Node-cached wrapper module the schematic uses (the schematics
// Vitest setup file, `tools/vitest/setup-schematics.ts`, registers an SWC
// `require` hook that makes requiring this `.ts` module work) and stub
// `getGlobalConfig` on it.
//
// We can't `vi.spyOn` it: SWC compiles the wrapper's named exports to
// non-configurable getters, so the property can't be redefined. Instead we swap
// the cached module's whole `exports` object for a writable copy whose
// `getGlobalConfig` delegates to a mutable value. The schematic requires this
// same cached module, so it picks up the stub.
const nodeRequire = createRequire(__filename);
const translocoPath = nodeRequire.resolve(
  '../../schematics-core/utils/transloco',
);
// Ensure the real module is loaded & cached before we swap its exports.
nodeRequire(translocoPath);
const translocoModule = nodeRequire.cache[translocoPath]!;

let mockedConfig: Partial<TranslocoGlobalConfig> = {};
translocoModule.exports = {
  ...translocoModule.exports,
  __esModule: true,
  getGlobalConfig: () => mockedConfig,
};

function mockGlobalConfig(config: Partial<TranslocoGlobalConfig>) {
  mockedConfig = config;
}

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
    mockGlobalConfig(globalConfig);
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

      mockGlobalConfig({
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
