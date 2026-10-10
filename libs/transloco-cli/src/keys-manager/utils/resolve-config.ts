import { existsSync } from 'fs';

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
  const { projectBasePath: sourceRoot, projectType } = resolveProjectBasePath(
    inlineConfig.project,
  );
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
