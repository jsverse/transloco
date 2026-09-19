import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { createWorkspace } from '../../schematics-core/testing';

const collectionPath = path.join(__dirname, '../collection.json');

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
