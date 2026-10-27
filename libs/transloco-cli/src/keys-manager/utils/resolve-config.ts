import { existsSync } from 'fs';
import path from 'node:path';

import {
  getGlobalConfig,
  searchGlobalConfig,
  TranslocoGlobalConfig,
} from '../../config/index.js';
import { nameConfigFile } from '../../config/load-error.js';
import { style } from '../../utils/style.js';
import { defaultConfig } from '../config.js';
import { getScopes } from '../keys-builder/utils/scope.utils.js';
import { messages } from '../messages.js';
import { Config } from '../types.js';

import { devlog } from './logger.js';
import { resolveConfigPaths } from './path.utils.js';
import { resolveProjectBasePath } from './resolve-project-base-path.js';
import { updateScopesMap } from './update-scopes-map.js';
import { isDirectory } from './validators.utils.js';

export function resolveConfig(inlineConfig: Partial<Config>): Config {
  const {
    projectBasePath: sourceRoot,
    projectType,
    projectRoot,
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
  const fileOptions = flatFileConfig(fileConfig);
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
    });
  }

  devlog('paths', 'Configuration Paths', {
    Input: mergedConfig.input,
    Output: mergedConfig.output,
    Translations: mergedConfig.translationsPath,
  });

  validateDirectories(mergedConfig);

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
 * a rootTranslationsPath meant relative to something else than the working directory.
 */
function checkOutputDefault(
  config: Config,
  {
    field,
    fromConfig,
    defaultFolder,
    project,
    projectRoot,
  }: {
    field: 'output' | 'translationsPath';
    fromConfig?: string;
    defaultFolder: string;
    project?: string;
    projectRoot?: string;
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
        `Transloco ${command}: The translations folder of the config, ${folder}, is outside project ${project} (${projectRoot}). ${command === 'find' ? 'Reading' : 'Writing to'} ${fallback} instead. Pass ${command === 'find' ? '--translations-path' : '--output'}, set keysManager.${field}, or give ${project} a Transloco config whose rootTranslationsPath is in ${projectRoot}, relative to the working directory.`,
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
      `Transloco extract: The translations folder of the config, ${folder}, does not exist and will be created. Its path is relative to the working directory.`,
    );
  }
}

function validateDirectories({ input, translationsPath, command }: Config) {
  let invalidPath = false;
  const log = (path: string, prop: string) => {
    const msg = existsSync(path)
      ? messages.pathIsNotDir
      : messages.pathDoesntExist;
    console.log(style(['bgRed', 'black'], `${prop} ${msg}`));
  };

  for (const path of input) {
    if (!isDirectory(path)) {
      invalidPath = true;
      log(path, 'Input');
    }
  }

  if (command === 'find' && !isDirectory(translationsPath)) {
    invalidPath = true;
    log(translationsPath, 'Translations');
  }

  invalidPath && process.exit(1);
}
