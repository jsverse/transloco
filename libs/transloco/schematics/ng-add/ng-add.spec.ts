import * as nodePath from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { createWorkspace } from '../../schematics-core/testing';

import { SchemaOptions } from './schema';

const collectionPath = nodePath.join(__dirname, '../collection.json');

describe('ng add', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

  describe('Ng module', () => {
    it(`GIVEN an NgModule-based Angular project
        WHEN ng-add schematic runs for project 'bar'
        THEN transloco config, loader, and root module are created`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        await createWorkspace(schematicRunner, {
          appOptions: { standalone: false },
        }),
      );
      expect(tree).toBeDefined();
      expect(tree.files).toContain('/transloco.config.ts');
      expect(tree.files).toContain('/projects/bar/src/app/transloco-loader.ts');
      expect(tree.files).toContain(
        '/projects/bar/src/app/transloco-root.module.ts',
      );
      expect(readFile(tree, 'app/transloco-root.module.ts')).toContain(
        "from './transloco-loader'",
      );
    });
  });

  describe('Standalone', () => {
    it(`GIVEN a standalone Angular project
        WHEN ng-add schematic runs for project 'bar'
        THEN transloco config and loader are created and provideTransloco is added to app.config.ts`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        await createWorkspace(schematicRunner),
      );
      expect(tree).toBeDefined();
      expect(tree.files).toContain('/transloco.config.ts');
      expect(tree.files).toContain('/projects/bar/src/app/transloco-loader.ts');
      expect(readFile(tree, 'app/app.config.ts')).toContain(
        'provideTransloco(',
      );
    });
  });

  describe('Folder Detection', () => {
    it(`GIVEN an Angular 18+ project with public folder
        WHEN ng-add schematic runs
        THEN translation files are created in public/i18n and loader uses correct path`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const initialTree = await createWorkspace(schematicRunner);

      // Create public folder to simulate Angular 18+
      initialTree.create('/public/favicon.ico', '');

      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        initialTree,
      );

      expect(tree.files).toContain('/public/i18n/en.json');
      expect(tree.files).toContain('/public/i18n/es.json');

      // Check that loader uses correct URL path
      const loaderContent = readFile(tree, 'app/transloco-loader.ts');
      expect(loaderContent).toContain('/i18n/${lang}.json');
      expect(loaderContent).not.toContain('/assets/i18n/');
    });

    it(`GIVEN a project with assets folder structure
        WHEN ng-add schematic runs
        THEN translation files are created in src/assets/i18n and loader uses correct path`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const initialTree = await createWorkspace(schematicRunner);

      // Create assets folder to simulate traditional Angular structure
      initialTree.create('/projects/bar/src/assets/icons/icon.png', '');

      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        initialTree,
      );

      expect(tree.files).toContain('/projects/bar/src/assets/i18n/en.json');
      expect(tree.files).toContain('/projects/bar/src/assets/i18n/es.json');

      // Check that loader uses correct URL path
      const loaderContent = readFile(tree, 'app/transloco-loader.ts');
      expect(loaderContent).toContain('/assets/i18n/${lang}.json');
    });

    it(`GIVEN ng-add schematic with custom path option
        WHEN schematic runs
        THEN translation files are created in custom path and loader uses correct path`, async () => {
      const options: SchemaOptions = {
        project: 'bar',
        path: 'custom/translations/',
      } as SchemaOptions;

      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        await createWorkspace(schematicRunner),
      );

      expect(tree.files).toContain(
        '/projects/bar/src/custom/translations/en.json',
      );
      expect(tree.files).toContain(
        '/projects/bar/src/custom/translations/es.json',
      );

      // Check that loader uses correct URL path
      const loaderContent = readFile(tree, 'app/transloco-loader.ts');
      expect(loaderContent).toContain('/custom/translations/${lang}.json');
    });

    it(`GIVEN an Angular 18+ project without explicit folder indicators
        WHEN ng-add schematic runs and checks package.json
        THEN public/i18n is used based on Angular version detection`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const initialTree = await createWorkspace(schematicRunner);

      // Simulate Angular 18+ by updating package.json
      const packageJson = JSON.parse(
        initialTree.read('/package.json')!.toString(),
      );
      packageJson.dependencies['@angular/core'] = '^18.0.0';
      initialTree.overwrite(
        '/package.json',
        JSON.stringify(packageJson, null, 2),
      );

      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        initialTree,
      );

      expect(tree.files).toContain('/public/i18n/en.json');
      expect(tree.files).toContain('/public/i18n/es.json');

      // Check that loader uses correct URL path for Angular 18+
      const loaderContent = readFile(tree, 'app/transloco-loader.ts');
      expect(loaderContent).toContain('/i18n/${lang}.json');
    });

    it(`GIVEN an Angular 17 project detected via package.json
        WHEN ng-add schematic runs
        THEN assets/i18n is used for pre-Angular 18 versions`, async () => {
      const options: SchemaOptions = { project: 'bar' } as SchemaOptions;
      const initialTree = await createWorkspace(schematicRunner);

      // Simulate Angular 17 by updating package.json
      const packageJson = JSON.parse(
        initialTree.read('/package.json')!.toString(),
      );
      packageJson.dependencies['@angular/core'] = '^17.0.0';
      initialTree.overwrite(
        '/package.json',
        JSON.stringify(packageJson, null, 2),
      );

      const tree = await schematicRunner.runSchematic(
        'ng-add',
        options,
        initialTree,
      );

      expect(tree.files).toContain('/projects/bar/src/assets/i18n/en.json');
      expect(tree.files).toContain('/projects/bar/src/assets/i18n/es.json');

      // Check that loader uses correct URL path for Angular <18
      const loaderContent = readFile(tree, 'app/transloco-loader.ts');
      expect(loaderContent).toContain('/assets/i18n/${lang}.json');
    });
  });
});

function readFile(host: UnitTestTree, path: string) {
  return host.get(`/projects/bar/src/${path}`)!.content.toString();
}
