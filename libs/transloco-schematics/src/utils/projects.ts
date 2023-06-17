import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';
import { SchematicsException, Tree } from '@angular-devkit/schematics';

export function getWorkspacePath(host: Tree): string {
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

export function setWorkspace(host: Tree, workspace): void {
  const path = getWorkspacePath(host);

  host.overwrite(path, JSON.stringify(workspace, null, 2));
}

export function getProject(host: Tree, project?: string) {
  const workspace = getWorkspace(host);
  if (workspace) {
    return workspace.projects[project];
  }

  throw new SchematicsException('could not find a workspace project');
}

export function setEnvironments(
  host: Tree,
  sourceRoot: string,
  transformer: (env: string) => string
) {
  const path = sourceRoot + '/environments';
  const environments = host.getDir(path);
  return environments.subfiles.forEach((file) => {
    const filePath = `${path}/${file}`;
    const configBuffer = host.read(filePath);
    const source = configBuffer.toString('utf-8');
    host.overwrite(filePath, transformer(source));
  });
}

export interface WorkspaceProject {
  root: string;
  projectType: string;
}

export function getProjectPath(host: Tree, project, options) {
  if (project.root.substr(-1) === '/') {
    project.root = project.root.substr(0, project.root.length - 1);
  }

  if (options.path === undefined) {
    const projectDirName =
      project.projectType === 'application' ? 'app' : 'lib';

    return `${project.root ? `/${project.root}` : ''}/src/${projectDirName}`;
  }

  return options.path;
}

export function isLib(
  host: Tree,
  options: { project?: string | undefined; path?: string | undefined }
) {
  const project = getProject(host, options.project);

  return project.projectType === 'library';
}
