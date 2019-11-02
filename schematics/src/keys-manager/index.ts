import { Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageToPackageJson, addScriptToPackageJson } from '../utils/package';
import { getWorkspace, setWorkspace } from '../utils/projects';
import { createConfig } from '../utils/transloco';
import { SchemaOptions } from './schema';

function installKeysManager(host: Tree, context: SchematicContext) {
  addPackageToPackageJson(host, 'devDependencies', 'ngx-build-plus', '^9.0.2');
  addPackageToPackageJson(host, 'devDependencies', '@ngneat/transloco-keys-manager', '1.0.0-beta.3');
  context.addTask(new NodePackageInstallTask());
}

export function updateAngularJson(host: Tree, options) {
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

function updateTranslocoConfig(host: Tree, langs: string[], translationsPath: string) {
  createConfig(host, langs, translationsPath);
}

function addKeysDetectiveScript(host: Tree) {
  addScriptToPackageJson(host, 'start', 'ng serve --extra-webpack-config webpack-dev.config.js');
  addScriptToPackageJson(host, 'i18n:extract', 'transloco-keys-manager extract');
  addScriptToPackageJson(host, 'i18n:find', 'transloco-keys-manager find');
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const langs = options.langs.split(',').map(l => l.trim());

    installKeysManager(host, context);
    createWebpackConfig(host);
    updateTranslocoConfig(host, langs, options.translationPath);
    addKeysDetectiveScript(host);
    updateAngularJson(host, options);

    return host;
  };
}
