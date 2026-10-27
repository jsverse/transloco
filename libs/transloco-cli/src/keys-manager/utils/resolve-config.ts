import { existsSync } from 'fs';
import path from 'path';

import {
  getGlobalConfig,
  searchGlobalConfig,
  TranslocoGlobalConfig,
} from '../../config/index.js';
import { nameConfigFile } from '../../config/load-error.js';
import { style, styleError } from '../../utils/style.js';
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
    defaulted,
  } = resolveProjectBasePath(inlineConfig.project);
  const defaults = defaultConfig({ projectType, sourceRoot });
  // `--config` names the one place to look in, otherwise the source root and its parents are searched
  const { config: fileConfig, filepath: configFile } = inlineConfig.config
    ? {
        config: loadConfig(inlineConfig.config),
        filepath: inlineConfig.config,
      }
    : searchGlobalConfig(sourceRoot);
  const userConfig = {
    // A config named with `--config` keeps its paths relative to the working directory, as in v8
    ...rebasePaths(
      flatFileConfig(fileConfig),
      inlineConfig.config ? undefined : configFile,
    ),
    ...inlineConfig,
  };
  const mergedConfig = {
    ...defaults,
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
 * The paths of a config are relative to the working directory, except in a
 * config found above it, the one at the root of the repository when the
 * command runs in a project folder, whose paths are relative to its own folder. They
 * are made relative to the working directory here. A path holding
 * `${sourceRoot}` is left as it is, the source root is relative to the
 * working directory already.
 */
function rebasePaths(
  options: Partial<Config>,
  configFile: string | undefined,
): Partial<Config> {
  if (configFile === undefined) return options;

  const cwd = process.cwd();
  const configDir = path.dirname(path.resolve(configFile));
  const fromCwd = path.relative(configDir, cwd);

  if (!fromCwd || fromCwd.startsWith('..') || path.isAbsolute(fromCwd)) {
    return options;
  }

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
    console.log(
      style(
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
