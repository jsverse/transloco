import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';
import { SchematicsException, Tree } from '@angular-devkit/schematics';

function getWorkspacePath(host: Tree): string {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const [path] = possibleFiles.filter((path) => host.exists(path));

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

export function setWorkspace(host: Tree, workspace: WorkspaceSchema): void {
  const path = getWorkspacePath(host);

  host.overwrite(path, JSON.stringify(workspace, null, 2));
}

export function getProject(host: Tree, project: string) {
  const workspace = getWorkspace(host);
  if (workspace) {
    return workspace.projects[project];
  }

  throw new SchematicsException('could not find a workspace project');
}

export function setEnvironments(
  host: Tree,
  sourceRoot: string,
  transformer: (env: string) => string,
) {
  const path = sourceRoot + '/environments';
  const environments = host.getDir(path);

  return environments.subfiles.forEach((file) => {
    const filePath = `${path}/${file}`;
    const configBuffer = host.read(filePath);
    const source = configBuffer!.toString('utf-8');
    host.overwrite(filePath, transformer(source));
  });
}
