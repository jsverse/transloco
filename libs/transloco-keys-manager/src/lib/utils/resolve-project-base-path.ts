import path from 'path';

import chalk from 'chalk';
import { cosmiconfigSync } from 'cosmiconfig';

import { ProjectType } from '../config';

import { coerceArray } from './collection.utils';
import { readFile } from './file.utils';
import { jsoncParser } from './json.utils';
import { isString } from './validators.utils';
import { normalizedGlob } from './normalize-glob-path';

const angularConfigFile = ['angular.json', '.angular.json'];
const workspaceConfigFile = 'workspace.json';
const projectConfigFile = 'project.json';
const defaultSourceRoot = 'src';

function searchConfig(searchPlaces: string[] | string, searchFrom = '') {
  const cwd = process.cwd();
  const resolvePath = path.resolve(cwd, searchFrom);
  const stopDir = path.resolve(cwd, '../');

  return cosmiconfigSync('', {
    stopDir,
    loaders: {
      '.json': jsoncParser,
    },
    searchPlaces: coerceArray(searchPlaces),
  }).search(resolvePath)?.config;
}

function logNotFound(searchPlaces: string[]) {
  console.log(
    chalk.black.bgRed(
      `Unable to load workspace config from ${searchPlaces.join(
        ', ',
      )}. Defaulting source root to '${defaultSourceRoot}'`,
    ),
  );
}

export function resolveProjectBasePath(projectName?: string): {
  projectBasePath: string;
  projectType?: ProjectType;
} {
  const angularConfig = searchConfig(angularConfigFile);
  const workspaceConfig = searchConfig(workspaceConfigFile);
  const projectConfig = resolveProjectConfig(projectName);

  if (!angularConfig && !workspaceConfig && !projectConfig) {
    logNotFound([...angularConfigFile, workspaceConfigFile, projectConfigFile]);

    return { projectBasePath: defaultSourceRoot };
  }

  let resolved: ReturnType<typeof resolveProject> | null = null;

  for (const config of [angularConfig, workspaceConfig, projectConfig]) {
    resolved = resolveProject(config, projectName);
    if (resolved) {
      break;
    }
  }

  if (!resolved) {
    console.log(
      chalk.black.bgRed(
        `Unable to resolve \`projectBasePath\` from configuration. Defaulting source root to '${defaultSourceRoot}'`,
      ),
    );

    return { projectBasePath: defaultSourceRoot };
  }

  return {
    projectBasePath: resolved.sourceRoot,
    projectType: resolved.projectType,
  };
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

      if (config && !config.sourceRoot) {
        // Modern Nx `project.json` files usually omit `sourceRoot`; Nx defaults
        // it to `<projectRoot>/src`. Without this the base path falls back to the
        // workspace-root `src`, so keys in libs go undetected (#952).
        const projectRoot =
          config.root || path.dirname(configPath).replace(/\\/g, '/');
        config.sourceRoot =
          projectRoot && projectRoot !== '.' ? `${projectRoot}/src` : 'src';
      }

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
): { sourceRoot: string; projectType: ProjectType } | null {
  let projectConfig = config;

  if (config?.projects) {
    projectName =
      projectName || config.defaultProject || Object.keys(config.projects)[0];
    const project = config.projects[projectName!];
    projectConfig = isString(project)
      ? searchConfig(projectConfigFile, project)
      : project;
  }

  if (projectConfig?.sourceRoot) {
    return {
      sourceRoot: projectConfig.sourceRoot,
      projectType: projectConfig.projectType,
    };
  }

  return null;
}
