import { Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageToPackageJson, addScriptToPackageJson } from '../utils/package';
import { getWorkspace, setWorkspace } from '../utils/projects';
import { createConfig } from '../utils/transloco';
import { SchemaOptions } from './schema';

function installKeysManager(host: Tree, context: SchematicContext) {
  addPackageToPackageJson(host, 'devDependencies', '@angular-builders/custom-webpack', 'latest');
  addPackageToPackageJson(host, 'devDependencies', '@ngneat/transloco-keys-manager', 'latest');
  context.addTask(new NodePackageInstallTask());
}

export function updateAngularJson(host: Tree, options) {
  const angularJson = getWorkspace(host);
  if (angularJson) {
    const project = angularJson.projects[options.project || angularJson.defaultProject];
    project.architect.serve.builder = '@angular-builders/custom-webpack:dev-server';
    project.architect.serve.options.customWebpackConfig = { path: './webpack.config.js' };
  }

  setWorkspace(host, angularJson);
}

export function createWebpackConfig(host: Tree) {
  const webpackConfig = `const { TranslocoExtractKeysWebpackPlugin } = require('@ngneat/transloco-keys-manager');
 
module.exports = {
 plugins: [ new TranslocoExtractKeysWebpackPlugin() ]
};
`;
  host.create('webpack.config.js', webpackConfig);
}

function updateTranslocoConfig(host: Tree, langs: string[], translationsPath: string) {
  createConfig(host, langs, translationsPath);
}

function addKeysDetectiveScript(host: Tree) {
  addScriptToPackageJson(host, 'keysDetective', 'transloco-keys-manager -f');
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
