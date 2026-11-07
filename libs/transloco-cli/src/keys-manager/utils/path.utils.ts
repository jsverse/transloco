import path, { sep } from 'node:path';

import { getConfig } from '../config';
import { Config, Scopes } from '../types';

import { isObject } from './validators.utils';

export function pathUnixFormat(path: string) {
  return path.split(sep).join('/');
}

export function buildPath(obj: Record<string, any>) {
  return Object.keys(obj).reduce((acc, curr) => {
    const keys = isObject(obj[curr])
      ? buildPath(obj[curr]).map((inner) => `${curr}.${inner}`)
      : [curr];
    acc.push(...keys);

    return acc;
  }, [] as string[]);
}

interface Options extends Pick<Config, 'fileFormat' | 'translationsPath'> {
  filePath: string;
}

/**
 * /Users/username/www/folderName/src/assets/i18n/admin/es.json => { scope: admin, lang: es }
 * /Users/username/www/folderName/src/assets/i18n/es.json => { scope: undefined, lang: es }
 */
export function getScopeAndLangFromPath({
  filePath,
  translationsPath,
  fileFormat,
}: Options) {
  filePath = pathUnixFormat(filePath);
  translationsPath = pathUnixFormat(translationsPath);

  if (!translationsPath.endsWith('/')) {
    translationsPath = `${translationsPath}/`;
  }

  const [_, pathWithScope] = filePath.split(translationsPath);
  const scopePath = pathWithScope.split('/');
  const removeExtension = (str: string) => str.replace(`.${fileFormat}`, '');

  let scope, lang;
  if (scopePath.length > 1) {
    lang = removeExtension(scopePath.pop()!);
    scope = scopePath.join('/');
  } else {
    lang = removeExtension(scopePath[0]);
  }

  return { scope, lang };
}

function resolvePath(configPath = '') {
  return path.resolve(process.cwd(), configPath);
}

export function resolveConfigPaths(config: Config) {
  const interpolate = interpolatePathFactory(config.__sourceRoot);

  config.input = config.input.map(interpolate).map(resolvePath);
  config.output = resolvePath(interpolate(config.output));
  config.translationsPath = resolvePath(interpolate(config.translationsPath));
}

type ScopeFiles = { path: string; scope: string }[];

export function buildScopeFilePaths({
  aliasToScope,
  output,
  langs,
  fileFormat,
}: Pick<Config, 'output' | 'langs' | 'fileFormat'> & {
  aliasToScope: Scopes['aliasToScope'];
}) {
  const { scopePathMap = {}, __sourceRoot = '' } = getConfig();
  const interpolate = interpolatePathFactory(__sourceRoot);

  return Object.values(aliasToScope).reduce(
    (files: ScopeFiles, scope: string) => {
      langs.forEach((lang) => {
        const bastPath = scopePathMap[scope]
          ? interpolate(scopePathMap[scope])
          : `${output}/${scope}`;

        files.push({
          path: `${bastPath}/${lang}.${fileFormat}`,
          scope,
        });
      });

      return files;
    },
    [],
  );
}

function interpolatePathFactory(sourceRoot?: string) {
  return sourceRoot
    ? (pathStr: string) => pathStr.replace(/\$\{sourceRoot}/g, sourceRoot)
    : (v: string) => v;
}
