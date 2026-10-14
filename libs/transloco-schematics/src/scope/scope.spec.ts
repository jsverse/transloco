import { createRequire } from 'node:module';
import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import type { TranslocoGlobalConfig } from '@jsverse/transloco-cli';

import { createWorkspace } from '../../schematics-core/testing';

// SchematicTestRunner loads the schematic with a raw Node `require`, outside of
// Vitest's module registry, so the config it reads is stubbed on the instance
// Node caches, as `join.spec.ts` does.
const nodeRequire = createRequire(__filename);
const translocoPath = nodeRequire.resolve(
  '../../schematics-core/utils/transloco',
);
nodeRequire(translocoPath);
const translocoModule = nodeRequire.cache[translocoPath]!;

let mockedConfig: Partial<TranslocoGlobalConfig> = {};
translocoModule.exports = {
  ...translocoModule.exports,
  __esModule: true,
  getGlobalConfig: () => mockedConfig,
};

const collectionPath = path.join(__dirname, '../collection.json');

describe('scope', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner);
    mockedConfig = { langs: ['en', 'es'] };
  });

  it(`GIVEN a scope name
      WHEN the scope schematic runs
      THEN a module providing the scope is generated with a file per language`, async () => {
    const tree = await schematicRunner.runSchematic(
      'scope',
      { name: 'reports', project: 'bar' },
      appTree,
    );

    const modulePath = tree.files.find((file) =>
      /reports[.-]module\.ts$/.test(file),
    );

    expect(modulePath).toBeDefined();
    expect(tree.readContent(modulePath!)).toContain(
      "provideTranslocoScope('reports')",
    );
    expect(tree.files).toEqual(
      expect.arrayContaining([
        '/projects/bar/src/assets/i18n/reports/en.json',
        '/projects/bar/src/assets/i18n/reports/es.json',
      ]),
    );
  });

  it(`GIVEN a scope name and the inline loader option
      WHEN the scope schematic runs
      THEN the loader is generated beside the module`, async () => {
    const tree = await schematicRunner.runSchematic(
      'scope',
      { name: 'reports', project: 'bar', inlineLoader: true },
      appTree,
    );

    expect(
      tree.files.some((file) => file.endsWith('reports/transloco.loader.ts')),
    ).toBe(true);
  });

  it.each([
    ['en,es', ['en', 'es']],
    ['en, es', ['en', 'es']],
    [' en ,es,', ['en', 'es']],
    ['fr', ['fr']],
  ])(
    `GIVEN the langs option %j
      WHEN the scope schematic runs
      THEN a translation file is created per language`,
    async (langs, expected) => {
      const tree = await schematicRunner.runSchematic(
        'scope',
        { name: 'reports', project: 'bar', langs },
        appTree,
      );
      const created = tree.files
        .filter((file) =>
          file.startsWith('/projects/bar/src/assets/i18n/reports/'),
        )
        .sort();

      expect(created).toEqual(
        expected.map(
          (lang) => `/projects/bar/src/assets/i18n/reports/${lang}.json`,
        ),
      );
    },
  );

  it(`GIVEN a comma separated langs option and the inline loader
      WHEN the scope schematic runs
      THEN the loader lists each language on its own`, async () => {
    const tree = await schematicRunner.runSchematic(
      'scope',
      { name: 'reports', project: 'bar', langs: 'en, es', inlineLoader: true },
      appTree,
    );
    const loader = tree.files.find((file) =>
      file.endsWith('reports/transloco.loader.ts'),
    );

    expect(tree.readContent(loader!)).toContain(`['en', 'es']`);
  });
});
