import { Rule, Tree, SchematicsException, SchematicContext } from '@angular-devkit/schematics';
import { TranslocoConfig } from '@ngneat/transloco-utils';
import { addScriptToPackageJson } from '../utils/package';
import { getWorkspace, setWorkspace } from '../utils/projects';
import { getConfig, updateConfig } from '../utils/transloco';
import { SchemaOptions } from './schema';

import { addPackageJsonDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { KEYS_MANAGER_VERSION, NGX_BUILD_PLUS_VERSION } from '../schematics.consts';

function installDependencies(context: SchematicContext) {
  context.logger.log('info', `🔍 Installing packages...`);
  context.addTask(new NodePackageInstallTask());
}

export function updateAngularJson(host: Tree, options: SchemaOptions) {
  const angularJson = getWorkspace(host);
  if (angularJson) {
    const project = angularJson.projects[options.project || angularJson.defaultProject];
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

function addKeysDetectiveScript(host: Tree, options: SchemaOptions) {
  if (options.strategy === 'Both') {
    addScriptToPackageJson(host, 'start', 'ng serve --extra-webpack-config webpack-dev.config.js');
    addScriptToPackageJson(host, 'i18n:extract', 'transloco-keys-manager extract');
  }

  if (options.strategy === 'CLI') {
    addScriptToPackageJson(host, 'i18n:extract', 'transloco-keys-manager extract');
  }

  if (options.strategy === 'Webpack Plugin') {
    addScriptToPackageJson(host, 'start', 'ng serve --extra-webpack-config webpack-dev.config.js');
  }

  addScriptToPackageJson(host, 'i18n:find', 'transloco-keys-manager find');
}

function updateTranslocoConfig(host: Tree, options: SchemaOptions) {
  const config: TranslocoConfig = getConfig() || {};
  let shouldUpdate = false;
  if (!config.rootTranslationsPath) {
    if (!options.translationPath) {
      throw new SchematicsException('Please provide the translation root path by using the --translation-path flag');
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

    config.langs = options.langs.split(',').map(l => l.trim());
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

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    addPackageJsonDependency(host, {
      name: '@ngneat/transloco-keys-manager',
      version: `^${KEYS_MANAGER_VERSION}`,
      overwrite: false,
      type: NodeDependencyType.Dev
    });

    updateTranslocoConfig(host, options);

    if (['Webpack Plugin', 'Both'].includes(options.strategy)) {
      addPackageJsonDependency(host, {
        name: 'ngx-build-plus',
        version: `^${NGX_BUILD_PLUS_VERSION}`,
        overwrite: false,
        type: NodeDependencyType.Dev
      });
      createWebpackConfig(host);
      updateAngularJson(host, options);
    }

    addKeysDetectiveScript(host, options);

    installDependencies(context);

    return host;
  };
}
