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
    it('should add transloco to specified project', async () => {
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
    it('should add transloco to specified standalone project', async () => {
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
    it('should use public/i18n for Angular 18+ projects with public folder', async () => {
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

    it('should use src/assets/i18n for projects with assets folder', async () => {
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

    it('should respect custom path when specified', async () => {
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

    it('should fallback to package.json version detection when folders are ambiguous', async () => {
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

    it('should fallback to assets for Angular <18 when package.json indicates older version', async () => {
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
