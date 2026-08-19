import { Tree } from '@angular-devkit/schematics';
import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';

/** Directories that never contain sources worth migrating. */
const IGNORED = /(^|\/)(node_modules|dist|\.git|\.angular|\.nx|coverage)(\/|$)/;

export interface WorkspaceProject {
  name: string;
  root: string;
  sourceRoot: string;
  isApplication: boolean;
}

/**
 * `null` when there is no workspace file. `ng update` also runs in repos that
 * aren't CLI-managed; those still get the template migration, just not the
 * per-project provider wiring.
 */
export function readWorkspace(tree: Tree): WorkspaceSchema | null {
  // `exists` and `read` do not always agree: an Nx host can report a virtual
  // `angular.json` as present and then fall through to the real filesystem to
  // read it. An exception escaping here would fail the whole rule chain, so
  // users would lose the template rewrite as well as the provider wiring.
  try {
    const path = ['/angular.json', '/.angular.json'].find((candidate) =>
      tree.exists(candidate),
    );
    if (!path) return null;

    const buffer = tree.read(path);
    if (!buffer) return null;

    return JSON.parse(buffer.toString()) as WorkspaceSchema;
  } catch {
    return null;
  }
}

export function getProjects(tree: Tree): WorkspaceProject[] {
  const workspace = readWorkspace(tree);
  if (!workspace?.projects) return [];

  return Object.entries(workspace.projects).map(([name, project]) => ({
    name,
    root: project.root ?? '',
    sourceRoot: project.sourceRoot ?? `${project.root ?? ''}/src`,
    isApplication: project.projectType !== 'library',
  }));
}

/** Paths under `root` matching `extensions`, minus build and dependency dirs. */
export function collectFiles(
  tree: Tree,
  root: string,
  extensions: string[],
): string[] {
  const paths: string[] = [];
  const normalized = root === '' || root === '/' ? '' : root.replace(/^\//, '');

  tree.getDir(`/${normalized}`).visit((path) => {
    if (IGNORED.test(path)) return;
    if (extensions.some((extension) => path.endsWith(extension))) {
      paths.push(path);
    }
  });

  return paths;
}
