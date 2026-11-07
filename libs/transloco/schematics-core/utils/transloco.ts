import { Tree } from '@angular-devkit/schematics';

import { generateConfigFile, NAMES } from './schematic';

export function createGlobalConfig(
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
