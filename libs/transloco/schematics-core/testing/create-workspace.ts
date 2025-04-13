import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import type { Schema as WorkspaceSchema } from '@schematics/angular/workspace/schema';
import {
  Style,
  ViewEncapsulation,
  Schema as ApplicationSchema,
} from '@schematics/angular/application/schema';
import type { Schema as LibrarySchema } from '@schematics/angular/library/schema';

export const defaultWorkspaceOptions: WorkspaceSchema = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '16.0.4',
  minimal: true,
};

export const defaultAppOptions: ApplicationSchema = {
  name: 'bar',
  inlineStyle: false,
  inlineTemplate: false,
  viewEncapsulation: ViewEncapsulation.Emulated,
  routing: false,
  style: Style.Css,
  skipTests: false,
};

const defaultLibOptions = {
  name: 'baz',
};

export function createWorkspace(
  schematicRunner: SchematicTestRunner,
  options: {
    workspaceOptions?: Partial<WorkspaceSchema>;
    appOptions?: Partial<ApplicationSchema>;
    libOptions?: Partial<LibrarySchema>;
  } = {},
) {
  const appOptions = { ...defaultAppOptions, ...options.appOptions };
  const workspaceOptions = {
    ...defaultWorkspaceOptions,
    ...options.workspaceOptions,
  };
  const libOptions = { ...defaultLibOptions, ...options.libOptions };
  const angularSchematic = '@schematics/angular';

  return schematicRunner
    .runExternalSchematic(angularSchematic, 'workspace', workspaceOptions)
    .then((tree) =>
      schematicRunner.runExternalSchematic(
        angularSchematic,
        'application',
        appOptions,
        tree,
      ),
    )
    .then((tree) =>
      schematicRunner.runExternalSchematic(
        angularSchematic,
        'library',
        libOptions,
        tree,
      ),
    );
}
