import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getConfiguredPackageManager } from '@angular/cli/src/utilities/config';
import { TranslocoGlobalConfig } from '@ngneat/transloco-utils';
import { execSync } from 'child_process';
import { addScriptToPackageJson } from '../utils/package';
import { getWorkspace, setWorkspace } from '../utils/projects';
import { updateConfig } from '../utils/transloco';
import { SchemaOptions } from './schema';
import { from, map } from 'rxjs';
import { getConfig } from '../utils/config';

async function installKeysManager() {
  const packageManager = await getConfiguredPackageManager();
  console.log('Installing packages for tooling...');
  if (packageManager === 'yarn') {
    execSync('yarn add --dev @ngneat/transloco-keys-manager ngx-build-plus');
  } else {
    execSync(
      'npm install --save-dev @ngneat/transloco-keys-manager ngx-build-plus'
    );
  }
}

export function updateAngularJson(host: Tree, options) {
  const angularJson = getWorkspace(host);
  if (angularJson) {
    const project = angularJson.projects[options.project];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - This is a custom builder type added after installing ngx-build-plus
    project.architect.serve.builder = 'ngx-build-plus:dev-server';
  }

  setWorkspace(host, angularJson);
}

export function createWebpackConfig(host: Tree) {
  const webpackConfig = `const { TranslocoExtractKeysWebpackPlugin } = require('@ngneat/transloco-keys-manager');
 
module.exports = {
  plugins: [new TranslocoExtractKeysWebpackPlugin()]
};
`;
  host.create('webpack-dev.config.js', webpackConfig);
}

function addKeysDetectiveScript(host: Tree, strategy: string) {
  if (strategy === 'Both') {
    addScriptToPackageJson(
      host,
      'start',
      'ng serve --extra-webpack-config webpack-dev.config.js'
    );
    addScriptToPackageJson(
      host,
      'i18n:extract',
      'transloco-keys-manager extract'
    );
  }

  if (strategy === 'CLI') {
    addScriptToPackageJson(
      host,
      'i18n:extract',
      'transloco-keys-manager extract'
    );
  }

  if (strategy === 'Webpack Plugin') {
    addScriptToPackageJson(
      host,
      'start',
      'ng serve --extra-webpack-config webpack-dev.config.js'
    );
  }

  addScriptToPackageJson(host, 'i18n:find', 'transloco-keys-manager find');
}

function updateTranslocoConfig(host, options) {
  const config: TranslocoGlobalConfig = getConfig() || {};
  let shouldUpdate = false;
  if (!config.rootTranslationsPath) {
    if (!options.translationPath) {
      throw new SchematicsException(
        'Please provide the translation root path by using the --translation-path flag'
      );
    }
    config.rootTranslationsPath = options.translationPath;
    shouldUpdate = true;
  }
  if (!config.langs) {
    if (!options.langs) {
      throw new SchematicsException(
        'Please provide the available languages either by using --langs or through the "langs" property in transloco.config.js file'
      );
    }

    config.langs = options.langs.split(',').map((l) => l.trim());
    shouldUpdate = true;
  }
  if (!config.keysManager) {
    config.keysManager = {};
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    updateConfig(host, config);
  }
}

export default function (options: SchemaOptions): Rule {
  // @ts-ignore
  return (host: Tree) => {
    // First install dependencies via command line to get the latest versions.
    return from(installKeysManager()).pipe(
      map(() => {
        updateTranslocoConfig(host, options);

        if (['Webpack Plugin', 'Both'].includes(options.strategy)) {
          createWebpackConfig(host);
          updateAngularJson(host, options);
        }

        addKeysDetectiveScript(host, options.strategy);

        return host;
      })
    );
  };
}
