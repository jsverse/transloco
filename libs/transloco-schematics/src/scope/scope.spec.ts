import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { createWorkspace } from '../../schematics-core/testing';

const collectionPath = path.join(__dirname, '../collection.json');
const SYMBOLS = [
  'provideTranslocoScope',
  'TranslocoDirective',
  'TranslocoPipe',
];

describe('Scope', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, {
      appOptions: { standalone: false },
    });
  });

  it(`GIVEN an existing NgModule
      WHEN the scope schematic adds a scope to it
      THEN the module imports the standalone directive and pipe and provides the scope`, async () => {
    const modulePath = '/projects/bar/src/app/admin/admin-module.ts';
    appTree = await schematicRunner.runExternalSchematic(
      '@schematics/angular',
      'module',
      { name: 'admin', project: 'bar' },
      appTree,
    );
    expect(appTree.files).toContain(modulePath);

    const tree = await schematicRunner.runSchematic(
      'scope',
      {
        name: 'admin',
        project: 'bar',
        langs: 'en',
        skipCreation: true,
        module: 'admin/admin-module',
      },
      appTree,
    );

    const content = tree.readContent(modulePath);
    expect(content).toContain(
      "import { provideTranslocoScope, TranslocoDirective, TranslocoPipe } from '@jsverse/transloco'",
    );
    expect(content).toContain('TranslocoDirective');
    expect(content).toContain('TranslocoPipe');
    expect(content).toContain("provideTranslocoScope('admin')");
    expect(content).not.toContain('TranslocoModule');
  });

  describe('imports', () => {
    const modulePath = '/projects/bar/src/app/admin/admin-module.ts';
    const scopeOptions = {
      name: 'admin',
      project: 'bar',
      langs: 'en',
      skipCreation: true,
      module: 'admin/admin-module',
    };
    const count = (content: string, text: string) =>
      content.split(text).length - 1;

    beforeEach(async () => {
      appTree = await schematicRunner.runExternalSchematic(
        '@schematics/angular',
        'module',
        { name: 'admin', project: 'bar' },
        appTree,
      );
    });

    it(`GIVEN a module that already imports from @jsverse/transloco
        WHEN the scope schematic runs
        THEN the symbols join that import instead of adding another statement`, async () => {
      appTree.overwrite(
        modulePath,
        [
          `import { TranslocoService } from '@jsverse/transloco';`,
          appTree.readContent(modulePath),
        ].join('\n'),
      );

      const tree = await schematicRunner.runSchematic(
        'scope',
        scopeOptions,
        appTree,
      );
      const content = tree.readContent(modulePath);

      expect(count(content, `from '@jsverse/transloco'`)).toBe(1);
      expect(content).toContain('TranslocoService');
      expect(count(content, 'import { TranslocoService')).toBe(1);
    });

    it(`GIVEN a module that already imports one of the symbols
        WHEN the scope schematic runs
        THEN that symbol is not imported twice`, async () => {
      appTree.overwrite(
        modulePath,
        [
          `import { TranslocoDirective } from '@jsverse/transloco';`,
          appTree.readContent(modulePath),
        ].join('\n'),
      );

      const tree = await schematicRunner.runSchematic(
        'scope',
        scopeOptions,
        appTree,
      );
      const importLine = tree
        .readContent(modulePath)
        .split('\n')
        .find((line) => line.includes(`from '@jsverse/transloco'`)) as string;

      expect(count(importLine, 'TranslocoDirective')).toBe(1);
      expect(importLine).toContain('provideTranslocoScope');
      expect(importLine).toContain('TranslocoPipe');
    });

    it(`GIVEN the scope schematic already ran on a module
        WHEN it runs again
        THEN the imports are not duplicated`, async () => {
      const once = await schematicRunner.runSchematic(
        'scope',
        scopeOptions,
        appTree,
      );
      const twice = await schematicRunner.runSchematic(
        'scope',
        { ...scopeOptions, name: 'other' },
        once,
      );
      const importLine = twice
        .readContent(modulePath)
        .split('\n')
        .find((line) => line.includes(`from '@jsverse/transloco'`)) as string;

      for (const symbol of SYMBOLS) {
        expect(count(importLine, symbol)).toBe(1);
      }
      expect(count(twice.readContent(modulePath), 'TranslocoDirective')).toBe(
        2,
      );
    });
  });

  it(`GIVEN an NgModule-based project and no target module
      WHEN the scope schematic runs
      THEN it generates the scope module and wires the standalone directive, pipe and scope into it`, async () => {
    const tree = await schematicRunner.runSchematic(
      'scope',
      { name: 'admin', project: 'bar', langs: 'en', skipCreation: true },
      appTree,
    );

    const modulePath = '/projects/bar/src/app/admin/admin-module.ts';
    expect(tree.files).toContain(modulePath);
    // The routing module must not be picked as the scope module.
    expect(tree.files).not.toContain(
      '/projects/bar/src/app/admin/admin-routing-module.ts',
    );

    const content = tree.readContent(modulePath);
    expect(content).toContain(
      "import { provideTranslocoScope, TranslocoDirective, TranslocoPipe } from '@jsverse/transloco'",
    );
    expect(content).toContain("provideTranslocoScope('admin')");
    // ...and the app's own module must be left alone.
    expect(
      tree.readContent('/projects/bar/src/app/app-module.ts'),
    ).not.toContain('provideTranslocoScope');
  });
});
