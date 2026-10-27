import { existsSync } from 'fs';
import path from 'node:path';

import {
  getGlobalConfig,
  searchGlobalConfig,
  TranslocoGlobalConfig,
} from '../../config/index.js';
import { nameConfigFile } from '../../config/load-error.js';
import { styleError } from '../../utils/style.js';
import { defaultConfig } from '../config.js';
import { getScopes } from '../keys-builder/utils/scope.utils.js';
import { messages } from '../messages.js';
import { Config } from '../types.js';

import { devlog } from './logger.js';
import { resolveConfigPaths } from './path.utils.js';
import {
  describeProjects,
  listProjects,
  resolveProjectBasePath,
} from './resolve-project-base-path.js';
import { updateScopesMap } from './update-scopes-map.js';
import { isDirectory } from './validators.utils.js';

export function resolveConfig(inlineConfig: Partial<Config>): Config {
  const {
    projectBasePath: sourceRoot,
    projectType,
    projectRoot,
    defaulted,
  } = resolveProjectBasePath(inlineConfig.project);
  const defaults = defaultConfig({ projectType, sourceRoot });
  // `--config` names the one place to look in, otherwise the source root and its parents are searched.
  // A path that isn't there counts as none, as in v8. The transloco command refuses it earlier.
  const { config: fileConfig, filepath: configFile } =
    inlineConfig.config && existsSync(inlineConfig.config)
      ? {
          config: loadConfig(inlineConfig.config),
          filepath: inlineConfig.config,
        }
      : searchGlobalConfig(sourceRoot);
  // A config named with `--config` keeps its paths relative to the working directory, as in v8
  const pathsFrom = folderAboveCwd(
    inlineConfig.config && existsSync(inlineConfig.config)
      ? undefined
      : configFile,
  );
  const fileOptions = rebasePaths(flatFileConfig(fileConfig), pathsFrom);
  const userConfig = { ...fileOptions, ...inlineConfig };
  // Unless an output is given, extract writes where find reads
  const outputDefault = fileOptions.translationsPath
    ? { output: fileOptions.translationsPath }
    : {};
  const mergedConfig = {
    ...defaults,
    ...outputDefault,
    ...userConfig,
    __sourceRoot: sourceRoot,
  } as Config;

  devlog('config', 'Config', {
    Default: defaults,
    'Transloco file': flatFileConfig(fileConfig),
    'Transloco file path': configFile,
    Inline: inlineConfig,
    Merged: mergedConfig,
  });

  resolveConfigPaths(mergedConfig);

  if (mergedConfig.command === 'extract' && !userConfig.output) {
    checkOutputDefault(mergedConfig, {
      field: 'output',
      fromConfig: outputDefault.output,
      defaultFolder: defaults.output,
      project: inlineConfig.project,
      projectRoot,
      pathsFrom,
    });
  }

  // Find reads the folder extract writes to
  if (mergedConfig.command === 'find' && !inlineConfig.translationsPath) {
    checkOutputDefault(mergedConfig, {
      field: 'translationsPath',
      fromConfig: fileOptions.translationsPath,
      defaultFolder: defaults.translationsPath,
      project: inlineConfig.project,
      projectRoot,
      pathsFrom,
    });
  }

  devlog('paths', 'Configuration Paths', {
    Input: mergedConfig.input,
    Output: mergedConfig.output,
    Translations: mergedConfig.translationsPath,
  });

  // The default input of a workspace whose project wasn't found is in no project
  validateDirectories(mergedConfig, Boolean(defaulted) && !userConfig.input);

  updateScopesMap({ input: mergedConfig.input });

  devlog('scopes', 'Scopes', {
    'Scopes map': getScopes().scopeToAlias,
  });

  return { ...mergedConfig, scopes: getScopes() };
}

function loadConfig(config: string) {
  try {
    return getGlobalConfig(config);
  } catch (error) {
    throw nameConfigFile(error, config);
  }
}

function flatFileConfig({
  keysManager,
  rootTranslationsPath,
  langs,
  scopePathMap,
}: TranslocoGlobalConfig): Partial<Config> {
  if (keysManager?.input) {
    keysManager.input = Array.isArray(keysManager.input)
      ? keysManager.input
      : keysManager.input.split(',');
  }

  return {
    ...(rootTranslationsPath ? { translationsPath: rootTranslationsPath } : {}),
    ...(langs ? { langs } : {}),
    ...(scopePathMap ? { scopePathMap } : {}),
    ...(keysManager as Omit<TranslocoGlobalConfig['keysManager'], 'input'> &
      Pick<Config, 'input'>),
  };
}

/**
 * A root config serves the project `ng add` set it up for. Another project picked with
 * `--project` writes to its own default folder, instead of into that project's
 * translations. Another folder that isn't there yet is pointed out, as it often means
 * a rootTranslationsPath meant relative to another folder. Paths are printed
 * relative to the working directory.
 */
function checkOutputDefault(
  config: Config,
  {
    field,
    fromConfig,
    defaultFolder,
    project,
    projectRoot,
    pathsFrom,
  }: {
    field: 'output' | 'translationsPath';
    fromConfig?: string;
    defaultFolder: string;
    project?: string;
    projectRoot?: string;
    /** The folder the paths of the config are relative to, when it isn't the working directory. */
    pathsFrom?: string;
  },
) {
  if (!fromConfig) return;

  const command = config.command === 'find' ? 'find' : 'extract';
  const folder = config[field];

  if (project && projectRoot !== undefined) {
    const fromRoot = path.relative(path.resolve(projectRoot), folder);
    const isInProject =
      fromRoot !== '..' &&
      !fromRoot.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(fromRoot);

    if (!isInProject) {
      const fallback = path.resolve(defaultFolder);
      console.warn(
        `Transloco ${command}: The translations folder of the config, ${fromCwd(folder)}, is outside project '${project}' (${fromCwd(projectRoot)}). ${command === 'find' ? 'Reading' : 'Writing to'} ${fromCwd(fallback)} instead.\n` +
          `To use another folder, pass ${command === 'find' ? '--translations-path' : '--output'}, set keysManager.${field}, or put a Transloco config in ${fromCwd(projectRoot)} whose rootTranslationsPath, relative to the working directory, is in it.`,
      );
      config[field] = fallback;

      return;
    }
  }

  // The default folder is no news, extract has always created it. Find reports a missing one itself
  if (
    command === 'extract' &&
    path.resolve(folder) !== path.resolve(defaultFolder) &&
    !existsSync(folder)
  ) {
    console.warn(
      `Transloco extract: The translations folder of the config, ${fromCwd(folder)}, does not exist and will be created. The paths of the config are relative to ${pathsFrom === undefined ? 'the working directory' : `its folder, ${fromCwd(pathsFrom)}`}.`,
    );
  }
}

/** The path relative to the working directory, which is shorter to print. */
function fromCwd(file: string) {
  return path.relative(process.cwd(), path.resolve(file)) || '.';
}

/**
 * The folder of a config found above the working directory, the one at the
 * root of the repository when the command runs in a project folder, whose paths
 * are relative to its own folder. Nothing for any other config, whose paths are
 * relative to the working directory.
 */
function folderAboveCwd(configFile: string | undefined) {
  if (configFile === undefined) return undefined;

  const configDir = path.dirname(path.resolve(configFile));
  const fromConfigDir = path.relative(configDir, process.cwd());

  return !fromConfigDir ||
    fromConfigDir.startsWith('..') ||
    path.isAbsolute(fromConfigDir)
    ? undefined
    : configDir;
}

/**
 * The paths of a config are relative to the working directory, except in a
 * config found above it, see `folderAboveCwd`, whose paths are relative to its
 * own folder. They are made relative to the working directory here. A path
 * holding `${sourceRoot}` is left as it is, the source root is relative to the
 * working directory already.
 */
function rebasePaths(
  options: Partial<Config>,
  configDir: string | undefined,
): Partial<Config> {
  if (configDir === undefined) return options;

  const cwd = process.cwd();
  const rebase = (value: string) =>
    typeof value !== 'string' ||
    path.isAbsolute(value) ||
    value.includes('${sourceRoot}')
      ? value
      : path.relative(cwd, path.resolve(configDir, value)) || '.';
  const { input, output, translationsPath, scopePathMap } = options;

  return {
    ...options,
    ...(input ? { input: input.map(rebase) } : {}),
    ...(output ? { output: rebase(output) } : {}),
    ...(translationsPath ? { translationsPath: rebase(translationsPath) } : {}),
    ...(scopePathMap
      ? {
          scopePathMap: Object.fromEntries(
            Object.entries(scopePathMap).map(([scope, value]) => [
              scope,
              rebase(value),
            ]),
          ),
        }
      : {}),
  };
}

function validateDirectories(
  { input, translationsPath, command }: Config,
  suggestProject = false,
) {
  let invalidPath = false;
  let inputMissing = false;
  const log = (path: string, prop: string) => {
    const msg = existsSync(path)
      ? messages.pathIsNotDir
      : messages.pathDoesntExist;
    console.error(styleError(['bgRed', 'black'], `${prop} ${msg}`));
  };

  for (const path of input) {
    if (!isDirectory(path)) {
      invalidPath = inputMissing = true;
      log(path, 'Input');
    }
  }

  const projects = inputMissing && suggestProject ? listProjects() : [];

  if (projects.length) {
    console.error(
      styleError(
        ['bgRed', 'black'],
        `Pass --project <name> to take the sources of a project, or --input to name them. ${describeProjects(projects)}`,
      ),
    );
  }

  if (command === 'find' && !isDirectory(translationsPath)) {
    invalidPath = true;
    log(translationsPath, 'Translations');
  }

  invalidPath && process.exit(1);
}
