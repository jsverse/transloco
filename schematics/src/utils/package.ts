import { Tree } from '@angular-devkit/schematics';

/**
 * Adds a package to the package.json
 */
export function addPackageToPackageJson(host: Tree, type: string, pkg: string, version: string): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json[type]) {
      json[type] = {};
    }

    if (!json[type][pkg]) {
      json[type][pkg] = version;
    }

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}

/**
 * Adds a script to the package.json
 */
export function addScriptToPackageJson(host: Tree, scriptName: string, script: string): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json['scripts']) {
      json['scripts'] = {};
    }

    json['scripts'][scriptName] = script;

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}
