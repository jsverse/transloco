import { Tree } from '@angular-devkit/schematics';

/**
 * Adds a script to the package.json
 */
export function addScriptToPackageJson(
  host: Tree,
  scriptName: string,
  script: string
): Tree {
  const packageFile = host.read('package.json');
  if (packageFile !== null) {
    const sourceText = packageFile.toString('utf-8');
    const json = JSON.parse(sourceText);
    json['scripts'] ??= {};
    json['scripts'][scriptName] = script;

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}
