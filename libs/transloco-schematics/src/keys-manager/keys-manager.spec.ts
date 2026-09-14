import * as childProcess from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import type { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

import { createWorkspace } from '../../schematics-core/testing';

// See join.spec.ts: the schematic is loaded through Node's raw `require`, so we
// stub `getGlobalConfig` on the exact Node-cached module the schematic uses.
const nodeRequire = createRequire(__filename);
const translocoPath = nodeRequire.resolve(
  '../../schematics-core/utils/transloco',
);
nodeRequire(translocoPath);
const translocoModule = nodeRequire.cache[translocoPath]!;

const mockedConfig: Partial<TranslocoGlobalConfig> = {
  rootTranslationsPath: 'src/assets/i18n/',
  langs: ['en', 'es'],
  keysManager: {},
};
translocoModule.exports = {
  ...translocoModule.exports,
  __esModule: true,
  getGlobalConfig: () => mockedConfig,
};

// The schematic installs its packages with `execSync`; never run a real install.
const nodeChildProcess = nodeRequire(
  'node:child_process',
) as typeof childProcess;
const originalExecSync = nodeChildProcess.execSync;

const collectionPath = path.join(__dirname, '../collection.json');

describe('Keys Manager', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  let appTree: UnitTestTree;
  let execSyncCalls: string[];

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner);
    execSyncCalls = [];
    nodeChildProcess.execSync = ((command: string) => {
      execSyncCalls.push(command);
      return Buffer.from('');
    }) as typeof childProcess.execSync;
  });

  afterEach(() => {
    nodeChildProcess.execSync = originalExecSync;
  });

  function readScripts(tree: UnitTestTree): Record<string, string> {
    return JSON.parse(tree.readContent('/package.json')).scripts;
  }

  function readServeBuilder(tree: UnitTestTree): string {
    return JSON.parse(tree.readContent('/angular.json')).projects.bar.architect
      .serve.builder;
  }

  it(`GIVEN no strategy option
      WHEN keys-manager schematic runs
      THEN the default "Both" strategy sets up the CLI and the Webpack plugin`, async () => {
    const tree = await schematicRunner.runSchematic(
      'keys-manager',
      { project: 'bar' },
      appTree,
    );

    expect(readScripts(tree)).toEqual(
      expect.objectContaining({
        start: 'ng serve --extra-webpack-config webpack-dev.config.js',
        'i18n:extract': 'transloco-keys-manager extract',
        'i18n:find': 'transloco-keys-manager find',
      }),
    );
    expect(tree.exists('/webpack-dev.config.js')).toBe(true);
    expect(readServeBuilder(tree)).toBe('ngx-build-plus:dev-server');
    expect(execSyncCalls).toHaveLength(1);
  });

  it(`GIVEN the CLI strategy
      WHEN keys-manager schematic runs
      THEN only the extract and find scripts are added`, async () => {
    const tree = await schematicRunner.runSchematic(
      'keys-manager',
      { project: 'bar', strategy: 'CLI' },
      appTree,
    );

    const scripts = readScripts(tree);
    expect(scripts['i18n:extract']).toBe('transloco-keys-manager extract');
    expect(scripts['i18n:find']).toBe('transloco-keys-manager find');
    expect(scripts['start']).not.toContain('webpack-dev.config.js');
    expect(tree.exists('/webpack-dev.config.js')).toBe(false);
    expect(readServeBuilder(tree)).not.toBe('ngx-build-plus:dev-server');
  });

  it(`GIVEN the Webpack Plugin strategy
      WHEN keys-manager schematic runs
      THEN the webpack config and dev-server builder are set up without an extract script`, async () => {
    const tree = await schematicRunner.runSchematic(
      'keys-manager',
      { project: 'bar', strategy: 'Webpack Plugin' },
      appTree,
    );

    const scripts = readScripts(tree);
    expect(scripts['start']).toBe(
      'ng serve --extra-webpack-config webpack-dev.config.js',
    );
    expect(scripts['i18n:extract']).toBeUndefined();
    expect(tree.exists('/webpack-dev.config.js')).toBe(true);
    expect(readServeBuilder(tree)).toBe('ngx-build-plus:dev-server');
  });

  it(`GIVEN a strategy outside the allowed values
      WHEN keys-manager schematic runs
      THEN schema validation rejects it`, async () => {
    await expect(
      schematicRunner.runSchematic(
        'keys-manager',
        { project: 'bar', strategy: 'both' },
        appTree,
      ),
    ).rejects.toThrow(/strategy/);
  });
});
