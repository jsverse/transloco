import { Tree } from '@angular-devkit/schematics';

import {
  getGlobalConfig as _getGlobalConfig,
  TranslocoGlobalConfig,
} from '@jsverse/transloco-utils';

import { generateConfigFile, NAMES } from './schematic';

let config: TranslocoGlobalConfig;

export function getGlobalConfig(): TranslocoGlobalConfig {
  if (config) return config;
  config = _getGlobalConfig();

  return config;
}

export function createTranslocoConfig(
  host: Tree,
  langs: string[],
  rootTranslationsPath = 'assets/i18n/',
) {
  if (!host.get(NAMES.CONFIG_FILE)) {
    host.create(
      NAMES.CONFIG_FILE,
      generateConfigFile({
        rootTranslationsPath: rootTranslationsPath,
        langs,
        keysManager: {},
      }),
    );
  }
}

export function updateTranslocoConfig(
  host: Tree,
  config: TranslocoGlobalConfig,
) {
  const originalConfig = getGlobalConfig();
  if (!originalConfig || Object.keys(originalConfig).length === 0) {
    return createTranslocoConfig(
      host,
      config.langs || [],
      config.rootTranslationsPath,
    );
  }
  host.overwrite(
    NAMES.CONFIG_FILE,
    generateConfigFile({ ...config, ...originalConfig }),
  );
}
