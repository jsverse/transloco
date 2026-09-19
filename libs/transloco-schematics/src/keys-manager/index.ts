import { execSync } from 'node:child_process';

import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getConfiguredPackageManager } from '@angular/cli/src/utilities/config';
import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
import { from, map } from 'rxjs';

import {
  updateGlobalConfig,
  getGlobalConfig,
  addScriptToPackageJson,
} from '../../schematics-core';

import { SchemaOptions } from './schema';

async function installKeysManager() {
  const packageManager = await getConfiguredPackageManager();
  console.log('Installing packages for tooling...');
  if (packageManager === 'yarn') {
    execSync('yarn add --dev @jsverse/transloco-keys-manager');
  } else {
    execSync('npm install --save-dev @jsverse/transloco-keys-manager');
  }
}

function addKeysDetectiveScript(host: Tree) {
  addScriptToPackageJson(
    host,
    'i18n:extract',
    'transloco-keys-manager extract',
  );
  addScriptToPackageJson(host, 'i18n:find', 'transloco-keys-manager find');
}

function updateTranslocoConfig(host: Tree, options: SchemaOptions) {
  const config: TranslocoGlobalConfig = getGlobalConfig() || {};
  let shouldUpdate = false;
  if (!config.rootTranslationsPath) {
    if (!options.translationPath) {
      throw new SchematicsException(
        'Please provide the translation root path by using the --translation-path flag',
      );
    }
    config.rootTranslationsPath = options.translationPath;
    shouldUpdate = true;
  }
  if (!config.langs) {
    if (!options.langs) {
      throw new SchematicsException(
        'Please provide the available languages either by using --langs or through the "langs" property in transloco.config.ts file',
      );
    }

    config.langs = options.langs.split(',').map((l: string) => l.trim());
    shouldUpdate = true;
  }
  if (!config.keysManager) {
    config.keysManager = {};
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    updateGlobalConfig(host, config);
  }
}

export default function (options: SchemaOptions): Rule {
  // @ts-ignore
  return (host: Tree) => {
    // First install dependencies via command line to get the latest versions.
    return from(installKeysManager()).pipe(
      map(() => {
        updateTranslocoConfig(host, options);
        addKeysDetectiveScript(host);

        return host;
      }),
    );
  };
}
