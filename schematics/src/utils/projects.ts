import { WorkspaceSchema } from '@angular-devkit/core/src/experimental/workspace';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { WorkspaceProject } from '@schematics/angular/utility/workspace-models';

export function getWorkspacePath(host: Tree): string {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const path = possibleFiles.filter(path => host.exists(path))[0];

  return path;
}

export function getWorkspace(host: Tree): WorkspaceSchema {
  const path = getWorkspacePath(host);
  const configBuffer = host.read(path);
  if (configBuffer === null) {
    throw new SchematicsException(`Could not find (${path})`);
  }
  const config = configBuffer.toString();

  return JSON.parse(config);
}

export function getProject(host: Tree, project?: string) {
  const workspace = getWorkspace(host);
  if (workspace) {
    return workspace.projects[project || workspace.defaultProject];
  }

  throw new SchematicsException('could not find a workspace project');
}
