import { Tree } from '@angular-devkit/schematics';
import { WorkspaceProject } from '@schematics/angular/utility/workspace-models';

import { SchemaOptions } from './schema';

export function getProjectPath(
  host: Tree,
  project: WorkspaceProject,
  options: SchemaOptions,
) {
  if (project.root.at(-1) === '/') {
    project.root = project.root.slice(0, project.root.length - 1);
  }

  if (options.path === undefined) {
    const projectDirName =
      project.projectType === 'application' ? 'app' : 'lib';

    return `${project.root ? `/${project.root}` : ''}/src/${projectDirName}`;
  }

  return options.path;
}
