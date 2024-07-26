import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { SchemaOptions } from '../ng-add/schema';

import { createWorkspace } from './create-workspace';

const collectionPath = path.join(__dirname, '../collection.json');

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
});

function readFile(host: UnitTestTree, path: string) {
  return host.get(`/projects/bar/src/${path}`).content.toString();
}
