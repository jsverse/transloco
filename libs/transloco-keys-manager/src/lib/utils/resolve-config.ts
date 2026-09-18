import { existsSync } from 'fs';

import {
  getGlobalConfig,
  TranslocoGlobalConfig,
} from '@jsverse/transloco-utils';
import chalk from 'chalk';

import { defaultConfig } from '../config';
import { getScopes } from '../keys-builder/utils/scope.utils';
import { messages } from '../messages';
import { Config } from '../types';

import { devlog } from './logger';
import { resolveConfigPaths } from './path.utils';
import { resolveProjectBasePath } from './resolve-project-base-path';
import { updateScopesMap } from './update-scopes-map';
import { isDirectory } from './validators.utils';

export function resolveConfig(inlineConfig: Partial<Config>): Config {
  const { projectBasePath: sourceRoot, projectType } = resolveProjectBasePath(
    inlineConfig.project,
  );
  const defaults = defaultConfig({ projectType, sourceRoot });
  const fileConfig = getGlobalConfig(inlineConfig.config || sourceRoot);
  const userConfig = { ...flatFileConfig(fileConfig), ...inlineConfig };
  const mergedConfig = {
    ...defaults,
    ...userConfig,
    __sourceRoot: sourceRoot,
  } as Config;

  devlog('config', 'Config', {
    Default: defaults,
    'Transloco file': flatFileConfig(fileConfig),
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

  updateScopesMap({
    input: mergedConfig.input,
    scopeProviderFunctions: mergedConfig.scopeProviderFunctions,
  });

  devlog('scopes', 'Scopes', {
    'Scopes map': getScopes().scopeToAlias,
  });

  return { ...mergedConfig, scopes: getScopes() };
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
    console.log(chalk.bgRed.black(`${prop} ${msg}`));
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
