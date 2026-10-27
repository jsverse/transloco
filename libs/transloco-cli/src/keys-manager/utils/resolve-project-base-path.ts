import { existsSync } from 'fs';
import path from 'path';

import { cosmiconfigSync } from 'cosmiconfig';

import {
  assertExplorerCanBeMade,
  assertRegularFile,
  assertSearchPlacesAreFiles,
} from '../../config/load-error.js';
import { CliError } from '../../errors.js';
import { styleError } from '../../utils/style.js';
import { ProjectType } from '../config.js';

import { coerceArray } from './collection.utils.js';
import { readFile } from './file.utils.js';
import { jsoncParser } from './json.utils.js';
import { isString } from './validators.utils.js';
import { normalizedGlob } from './normalize-glob-path.js';

const angularConfigFile = ['angular.json', '.angular.json'];
const workspaceConfigFile = 'workspace.json';
const projectConfigFile = 'project.json';
const defaultSourceRoot = 'src';

function searchConfig(searchPlaces: string[] | string, searchFrom = '') {
  const cwd = process.cwd();
  const resolvePath = path.resolve(cwd, searchFrom);
  const stopDir = path.resolve(cwd, '../');
  const places = coerceArray(searchPlaces);

  // The search opens what it finds, which a FIFO or a device would not survive
  assertExplorerCanBeMade();

  for (let dir = resolvePath; ; dir = path.dirname(dir)) {
    assertSearchPlacesAreFiles(dir, places);

    if (dir === stopDir || path.dirname(dir) === dir) break;
  }

  return cosmiconfigSync('', {
    stopDir,
    loaders: {
      '.json': jsoncParser,
    },
    searchPlaces: places,
  }).search(resolvePath)?.config;
}

function logNotFound(searchPlaces: string[]) {
  console.error(
    styleError(
      ['black', 'bgRed'],
      `Unable to load workspace config from ${searchPlaces.join(
        ', ',
      )}. Defaulting source root to '${defaultSourceRoot}'`,
    ),
  );
}

/**
 * The source root of the project and its root, `quiet` leaves out the notice
 * printed when it has to fall back to the default. A project that is named but
 * is in none of the workspace configs is an error, as its sources are not in
 * `src` either. `defaulted` tells that no project gave the source root.
 */
export function resolveProjectBasePath(
  projectName?: string,
  { quiet = false }: { quiet?: boolean } = {},
): {
  projectBasePath: string;
  projectType?: ProjectType;
  projectRoot?: string;
  defaulted?: true;
} {
  const angularConfig = searchConfig(angularConfigFile);
  const workspaceConfig = searchConfig(workspaceConfigFile);
  const projectConfig = resolveProjectConfig(projectName);

  if (!angularConfig && !workspaceConfig && !projectConfig) {
    assertProjectIsKnown(projectName);

    // A workspace of project.json files alone has no default project, which
    // the error of a missing input asks to pass with --project
    if (!quiet && !listProjects().length) {
      logNotFound([
        ...angularConfigFile,
        workspaceConfigFile,
        projectConfigFile,
      ]);
    }

    return { projectBasePath: defaultSourceRoot, defaulted: true };
  }

  let resolved: ReturnType<typeof resolveProject> | null = null;
  let fromProjectConfig = false;

  for (const config of [angularConfig, workspaceConfig, projectConfig]) {
    resolved = resolveProject(config, projectName);
    if (resolved) {
      fromProjectConfig = config === projectConfig;
      break;
    }
  }

  if (!resolved) {
    assertProjectIsKnown(projectName);

    if (!quiet) {
      console.error(
        styleError(
          ['black', 'bgRed'],
          `Unable to resolve \`projectBasePath\` from configuration. Defaulting source root to '${defaultSourceRoot}'`,
        ),
      );
    }

    return { projectBasePath: defaultSourceRoot, defaulted: true };
  }

  const toCwd = fromProjectConfig ? fromWorkspaceRoot : (p: string) => p;

  return {
    projectBasePath: toCwd(resolved.sourceRoot),
    projectType: resolved.projectType,
    projectRoot: toCwd(resolved.root),
  };
}

const workspaceRootMarkers = [
  'nx.json',
  ...angularConfigFile,
  workspaceConfigFile,
];

/**
 * The `sourceRoot` and `root` of a `project.json` are relative to the workspace
 * root, which is not the cwd when the command runs from within a project
 * (`--cwd apps/shop`). Returns the path relative to the cwd.
 */
function fromWorkspaceRoot(sourceRoot: string) {
  if (path.isAbsolute(sourceRoot)) return sourceRoot;

  const cwd = path.resolve(process.cwd());

  for (let dir = cwd; ; dir = path.dirname(dir)) {
    if (workspaceRootMarkers.some((file) => existsSync(path.join(dir, file)))) {
      return dir === cwd
        ? sourceRoot
        : path.relative(cwd, path.resolve(dir, sourceRoot)) || '.';
    }

    if (path.dirname(dir) === dir) return sourceRoot;
  }
}

function assertProjectIsKnown(projectName: string | undefined) {
  if (projectName === undefined) return;

  const { projects, directories } = scanProjects();

  // A `project.json` is found by its directory as well, whatever its name
  if (projects.includes(projectName) || directories.includes(projectName)) {
    return;
  }

  throw new CliError(
    `Transloco: the project '${projectName}' was not found in ${[...angularConfigFile, workspaceConfigFile].join(', ')} or any ${projectConfigFile}. ${describeProjects(projects)}`,
  );
}

/** The projects as a sentence, for a message that asks to pick one. */
export function describeProjects(projects: string[]) {
  return projects.length
    ? `The projects of the workspace are: ${projects.join(', ')}.`
    : 'The workspace has no project.';
}

/** The names of the projects of the workspace, which `--project` takes. */
export function listProjects(): string[] {
  return scanProjects().projects;
}

/**
 * The projects of the workspace configs, and of every `project.json` the one
 * it names, or else the one of the directory holding it, which is what a
 * config omitting the name is named after. `directories` holds the
 * directories of all of them.
 */
function scanProjects() {
  const projects = new Set<string>();
  const directories = new Set<string>();

  for (const config of [
    searchConfig(angularConfigFile),
    searchConfig(workspaceConfigFile),
  ]) {
    Object.keys(config?.projects ?? {}).forEach((name) => projects.add(name));
  }

  for (const configPath of normalizedGlob(`**/${projectConfigFile}`).sort()) {
    const resolvedConfigPath = path.resolve(configPath);
    const directory = path.basename(path.dirname(resolvedConfigPath));
    let config: Record<string, any> | undefined;

    assertRegularFile(resolvedConfigPath);

    // The resolution warns about a config it can't parse, the list just goes by its directory
    try {
      config = jsoncParser(configPath, readFile(resolvedConfigPath));
    } catch {
      config = undefined;
    }

    directories.add(directory);

    if (config?.projects) {
      Object.keys(config.projects).forEach((name) => projects.add(name));
    } else {
      projects.add(isString(config?.name) ? config.name : directory);
    }
  }

  return { projects: [...projects], directories: [...directories] };
}

/**
 * Locates the `project.json` of the given project.
 *
 * The project name can't be used as a path since workspaces are free to name a
 * project differently than the directory holding it, e.g. `libs/booking/ui/button`
 * is commonly named `booking-ui-button`. Therefore every `project.json` is matched
 * against its `name`, preferring it over the directory name, which is what a config
 * omitting the `name` is named after.
 *
 * Falling back to the nearest config is limited to the cases it can actually
 * answer, otherwise an unknown name would resolve to whichever project happens
 * to sit closest to the cwd.
 */
function resolveProjectConfig(projectName?: string) {
  if (projectName) {
    const namePattern = new RegExp(
      `"name"\\s*:\\s*"${escapeRegExp(projectName)}"`,
    );
    // a config omitting the `name` is named after the directory holding it, which
    // makes it a stronger match than one naming itself something else entirely
    let directoryMatch: Record<string, any> | undefined;
    let renamedDirectoryMatch: Record<string, any> | undefined;

    // sorted so that ties between equally good matches break the same way
    // everywhere, the traversal order is otherwise the file system's to pick
    for (const configPath of normalizedGlob(`**/${projectConfigFile}`).sort()) {
      // glob resolves matches against `process.cwd()`, but returns them as
      // relative paths; resolving them ourselves keeps the subsequent read
      // consistent even when `process.cwd()` is mocked (e.g. in tests)
      const resolvedConfigPath = path.resolve(configPath);

      assertRegularFile(resolvedConfigPath);

      const isDirectoryMatch =
        !directoryMatch &&
        path.basename(path.dirname(resolvedConfigPath)) === projectName;
      const content = readFile(resolvedConfigPath);

      // a workspace can hold hundreds of configs, none of which are worth
      // parsing unless their raw content mentions the name we are after
      if (!isDirectoryMatch && !namePattern.test(content)) {
        continue;
      }

      const config = parseProjectConfig(configPath, content);

      if (config?.name === projectName) {
        return config;
      }

      if (isDirectoryMatch) {
        if (config?.name) {
          renamedDirectoryMatch ??= config;
        } else {
          directoryMatch = config;
        }
      }
    }

    const fallback = directoryMatch ?? renamedDirectoryMatch;

    if (fallback) {
      return fallback;
    }
  }

  // only a root level config holding a `projects` map can point at another project
  const nearestConfig = searchConfig(projectConfigFile);

  return !projectName || nearestConfig?.projects ? nearestConfig : undefined;
}

/**
 * A single unparsable config shouldn't take down the whole scan, it may well
 * belong to a project unrelated to the one we are resolving.
 */
function parseProjectConfig(configPath: string, content: string) {
  try {
    return jsoncParser(configPath, content);
  } catch (e: any) {
    console.warn('Skipping the config at "%s":', configPath, e.message);

    return undefined;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveProject(
  config: Record<string, any>,
  projectName: string | undefined,
): { sourceRoot: string; projectType: ProjectType; root: string } | null {
  let projectConfig = config;
  let projectDir: string | undefined;

  if (config?.projects) {
    projectName =
      projectName || config.defaultProject || Object.keys(config.projects)[0];
    const project = config.projects[projectName!];
    projectDir = isString(project) ? project : undefined;
    projectConfig = isString(project)
      ? searchConfig(projectConfigFile, project)
      : project;
  }

  if (projectConfig?.sourceRoot) {
    return {
      sourceRoot: projectConfig.sourceRoot,
      projectType: projectConfig.projectType,
      // Nx leaves the root out of a project.json, the source root is in it
      root:
        projectConfig.root ??
        projectDir ??
        path.dirname(projectConfig.sourceRoot),
    };
  }

  return null;
}
