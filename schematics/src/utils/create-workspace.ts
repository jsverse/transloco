import { UnitTestTree, SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { map, switchMap } from 'rxjs/operators';

export const defaultWorkspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '8.0.0',
  defaultProject: 'bar'
};

export const defaultAppOptions = {
  name: 'bar',
  inlineStyle: false,
  inlineTemplate: false,
  viewEncapsulation: 'Emulated',
  routing: false,
  style: 'css',
  skipTests: false
};

const defaultLibOptions = {
  name: 'baz'
};

export function getTestProjectPath(
  workspaceOptions: any = defaultWorkspaceOptions,
  appOptions: any = defaultAppOptions
) {
  return `/${workspaceOptions.newProjectRoot}/${appOptions.name}`;
}

export async function createWorkspace(
  schematicRunner: SchematicTestRunner,
  appTree: UnitTestTree,
  workspaceOptions = defaultWorkspaceOptions,
  appOptions = defaultAppOptions,
  libOptions = defaultLibOptions
) {
  const angularSchematic = '@schematics/angular';
  return schematicRunner
    .runExternalSchematicAsync(angularSchematic, 'workspace', workspaceOptions)
    .pipe(
      switchMap(tree => schematicRunner.runExternalSchematicAsync(angularSchematic, 'application', appOptions, tree)),
      switchMap(tree => schematicRunner.runExternalSchematicAsync(angularSchematic, 'library', libOptions, tree))
    )
    .toPromise();
}
