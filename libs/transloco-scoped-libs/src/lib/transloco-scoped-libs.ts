import path from 'node:path';

import chalk from 'chalk';
import glob from 'glob';
import chokidar from 'chokidar';
import fsExtra from 'fs-extra';
import { TranslocoGlobalConfig } from '@ngneat/transloco-utils';

import {
  coerceArray,
  cutPath,
  getPackageJson,
  insertPathToGitIgnore,
  isString,
  readJson,
  writeJson,
} from './scoped-libs.utils';
import {
  CopyScopeOptions,
  CopyScopeTranslationsOptions,
  ScopedLibsOptions,
  SetTranslationOptions,
} from './scoped-libs.types';

const libSrcExample = `
  e.g:
  module.exports = {
    scopedLibs: [{
      src: './projects/core',
      dist: ['./projects/spa/src/assets/i18n', './src/assets/i18n/']
    }]
  };
`;

const packageJsoni18nExample = `
  e.g:
  {
    "i18n": [
      {
        "scope": "core",
        "path": "src/lib/i18n"
      }
    ]
  }
`;

/**
 * watch - if true the script will run in watch mode
 * skipGitIgnoreUpdate - if false tries to add an entry to the .gitignore for each of the translation files
 * rootTranslationsPath - the root directory of the translation files.
 * scopedLibs - list of all translation scoped project paths.
 */
export default function run({
  watch,
  skipGitIgnoreUpdate,
  rootTranslationsPath,
  scopedLibs,
}: ScopedLibsOptions) {
  const scopedLibsArr = coerceScopedLibs(scopedLibs, rootTranslationsPath);
  const startMsg = watch
    ? 'Running Transloco Scoped Libs in watch mode'
    : 'Starting Transloco Scoped Libs...';
  console.log(chalk.magenta(startMsg));

  for (const lib of scopedLibsArr) {
    if (!lib.src) {
      console.log(
        chalk.red(`Please specify the library's src.`, libSrcExample)
      );

      return;
    }

    const pkg = getPackageJson(lib.src);
    if (!pkg.content.i18n) {
      console.log(
        chalk.red(
          `${path.join(lib.src, 'package.json')} is missing i18n information.`,
          packageJsoni18nExample
        )
      );

      return;
    }

    if (!lib.dist?.length) {
      console.log(
        chalk.red(
          'please specify dist path, by either set "rootTranslationsPath" or specify the "dist" for each library',
          libSrcExample
        )
      );

      return;
    }

    const outputs = lib.dist.map((o) => path.resolve(o));
    const input = path.dirname(pkg.path);
    for (const scopeConfig of pkg.content.i18n) {
      const { scope, strategy } = scopeConfig;

      glob(
        `${path.join(input, scopeConfig.path)}/**/*.json`,
        {},
        function (err, files) {
          if (err) console.log(chalk.red(err));

          for (const output of outputs) {
            copyScopes({
              outputDir: output,
              strategy,
              files,
              skipGitIgnoreUpdate,
              scope,
            });
          }

          if (watch) {
            chokidar.watch(files).on('change', (file) => {
              for (const output of outputs) {
                // TODO should we skip the git ignore update here?
                copyScopes({
                  outputDir: output,
                  strategy,
                  files: [file],
                  scope,
                });
              }
            });
          }
        }
      );
    }
  }
}

function coerceScopedLibs(
  scopedLibs: TranslocoGlobalConfig['scopedLibs'],
  defaultPath: TranslocoGlobalConfig['rootTranslationsPath']
) {
  if (!scopedLibs?.length) {
    console.log(
      chalk.red(
        'Please add "scopedLibs" configuration in transloco.config.js file.',
        libSrcExample
      )
    );

    return [];
  }

  return scopedLibs.map((lib) => {
    return isString(lib)
      ? { src: lib, dist: [defaultPath] }
      : { ...lib, dist: coerceArray(lib.dist) };
  });
}

function copyScopes(options: CopyScopeOptions) {
  const resolvedOptions: CopyScopeTranslationsOptions = {
    ...options,
    fileExtension: 'json',
  };

  if (resolvedOptions.strategy === 'join') {
    resolvedOptions.fileExtension = 'vendor.json';
  } else {
    resolvedOptions.outputDir = path.join(
      resolvedOptions.outputDir,
      options.scope
    );
    fsExtra.mkdirsSync(resolvedOptions.outputDir);
  }

  copyScopeTranslationFiles(resolvedOptions);
}

function copyScopeTranslationFiles(options: CopyScopeTranslationsOptions) {
  const {
    files,
    fileExtension,
    outputDir,
    skipGitIgnoreUpdate,
    strategy,
    scope,
  } = options;

  for (let translationFilePath of files) {
    translationFilePath = path.normalize(translationFilePath);
    const [lang] = path.basename(translationFilePath).split('.');

    const fileName = `${lang}.${fileExtension}`;
    const outputFilePath = path.join(outputDir, fileName);

    console.log(
      '✅ Copy translation from file:',
      chalk.blue(cutPath(translationFilePath)),
      'to:',
      chalk.blue(cutPath(outputFilePath))
    );

    if (!skipGitIgnoreUpdate) {
      const path = strategy === 'join' ? outputFilePath : outputDir;
      insertPathToGitIgnore(path);
    }

    setTranslationFile({
      translationFilePath,
      outputFilePath,
      strategy,
      scope,
    });
  }
}

function setTranslationFile({
  translationFilePath: targetFilePath,
  scope,
  strategy,
  outputFilePath,
}: SetTranslationOptions) {
  let content = readJson(targetFilePath);

  if (!content) {
    return;
  }

  if (strategy === 'join') {
    content = { ...readJson(outputFilePath), [scope]: content };
  }

  writeJson(outputFilePath, content);
}
