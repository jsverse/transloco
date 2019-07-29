import { WorkspaceSchema } from '@angular-devkit/core/src/experimental/workspace';
import { UnitTestTree, SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { createWorkspace, getTestProjectPath } from '../utils/create-workspace';
import { SchemaOptions, Loaders } from './schema';

describe('ng add', () => {
  let appTree: UnitTestTree;
  const schematicRunner = new SchematicTestRunner('@ngneat/transloco', path.join(__dirname, '../collection.json'));

  const defaultOptions: SchemaOptions = { langs: 'en, es', loader: Loaders.Http, module: 'app' };
  const projectPath = getTestProjectPath();
  const appModulePath = projectPath + '/src/app/app.module.ts';

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
  });

  // it('should contain TranslocoModule in imports for default config', (done) => {
  //   const options = { ...defaultOptions };
  //
  //   schematicRunner.runSchematicAsync('ng-add', options, appTree)
  //     .subscribe(tree => {
  //       console.log(appTree.readContent(appModulePath));
  //       // const appModule = tree.readContent('./src/app/app.module.ts');
  //       expect(appTree.readContent(appModulePath)).toMatch(
  //         /import { TranslocoModule, httpLoader, TRANSLOCO_CONFIG, TranslocoConfig } from '@ngneat\/transloco';/
  //       );
  //       done();
  //     });
  // });
});
