import fs from 'node:fs';
import path from 'node:path';

import { glob } from 'glob';
import chokidar, { type FSWatcher } from 'chokidar';

import { TranslocoGlobalConfig } from '../config/index.js';
import { makeDir } from '../utils/file-system.js';
import { style } from '../utils/style.js';

import {
  cutPath,
  getPackageJson,
  insertPathToGitIgnore,
  isString,
  readJson,
  writeJson,
} from './scoped-libs.utils.js';
import {
  CopyScopeOptions,
  CopyScopeTranslationsOptions,
  ScopedLib,
  ScopedLibsOptions,
  SetTranslationOptions,
} from './scoped-libs.types.js';

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
 * onProblem - reports a misconfigured library, which is skipped, defaults to printing it in red.
 *
 * @returns a function that stops the watchers, which there are in watch mode,
 * with the number of them as `watching`
 */
export default async function run({
  watch,
  skipGitIgnoreUpdate,
  rootTranslationsPath,
  scopedLibs,
  onProblem = (problem) => console.log(style('red', problem)),
}: ScopedLibsOptions) {
  const watchers: FSWatcher[] = [];
  const stopWatching = async () => {
    await Promise.all(watchers.map((watcher) => watcher.close()));
  };
  const scopedLibsArr = coerceScopedLibs(
    scopedLibs,
    rootTranslationsPath,
    onProblem,
  );
  const startMsg = watch
    ? 'Running Transloco Scoped Libs in watch mode'
    : 'Starting Transloco Scoped Libs...';
  console.log(style('magenta', startMsg));

  // A misconfigured library is reported and skipped, the ones after it are still copied
  for (const lib of scopedLibsArr) {
    try {
      await copyLib(lib, { watch, skipGitIgnoreUpdate, watchers, onProblem });
    } catch (error) {
      onProblem(
        `${lib.src}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return Object.assign(stopWatching, { watching: watchers.length });
}

async function copyLib(
  lib: ScopedLib,
  {
    watch,
    skipGitIgnoreUpdate,
    watchers,
    onProblem,
  }: Pick<ScopedLibsOptions, 'watch' | 'skipGitIgnoreUpdate'> & {
    watchers: FSWatcher[];
    onProblem: (problem: string) => void;
  },
) {
  if (!lib.src) {
    onProblem(`Please specify the library's src. ${libSrcExample}`);

    return;
  }

  const pkg = getPackageJson(lib.src);
  if (!fs.existsSync(pkg.path)) {
    onProblem(`${path.join(lib.src, 'package.json')} does not exist.`);

    return;
  }

  if (!pkg.content) {
    onProblem(`${path.join(lib.src, 'package.json')} is not valid JSON.`);

    return;
  }

  if (!pkg.content.i18n) {
    onProblem(
      `${path.join(lib.src, 'package.json')} is missing i18n information. ${packageJsoni18nExample}`,
    );

    return;
  }

  if (!lib.dist?.length) {
    onProblem(
      `please specify dist path, by either set "rootTranslationsPath" or specify the "dist" for each library ${libSrcExample}`,
    );

    return;
  }

  const outputs = lib.dist.map((o) => path.resolve(o));
  const input = path.dirname(pkg.path);
  const isWindows = process.platform === 'win32';

  // Sort scopes: narrow paths first, then wide paths (so wide paths include all data)
  const getDepth = (scopePath: string) =>
    scopePath.split(/[\\/]+/).filter(Boolean).length;

  const sortedScopes = [...pkg.content.i18n].sort((a, b) => {
    return getDepth(b.path) - getDepth(a.path);
  });

  for (const scopeConfig of sortedScopes) {
    const { scope, strategy } = scopeConfig;

    const files = await glob(
      `${path.join(input, scopeConfig.path)}/**/*.json`,
      {
        windowsPathsNoEscape: isWindows,
      },
    );

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
      // The folder is watched, not the files found now, to pick up a file added later
      const copyFile = (file: string) => {
        if (!file.endsWith('.json')) return;

        for (const output of outputs) {
          // TODO should we skip the git ignore update here?
          copyScopes({
            outputDir: output,
            strategy,
            files: [file],
            skipGitIgnoreUpdate,
            scope,
          });
        }
      };

      watchers.push(
        chokidar
          .watch(path.join(input, scopeConfig.path), { ignoreInitial: true })
          .on('add', copyFile)
          .on('change', copyFile),
      );
    }
  }
}

function coerceScopedLibs(
  scopedLibs: TranslocoGlobalConfig['scopedLibs'],
  defaultPath: TranslocoGlobalConfig['rootTranslationsPath'],
  onProblem: (problem: string) => void,
): ScopedLib[] {
  if (!scopedLibs?.length) {
    onProblem(
      `Please add "scopedLibs" configuration in transloco.config.ts file. ${libSrcExample}`,
    );

    return [];
  }

  return scopedLibs.map((lib): ScopedLib => {
    return isString(lib)
      ? { src: lib, dist: defaultPath ? [defaultPath] : [] }
      : lib;
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
      options.scope,
    );
    makeDir(resolvedOptions.outputDir);
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
      style('blue', cutPath(translationFilePath)),
      'to:',
      style('blue', cutPath(outputFilePath)),
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
    // Read existing file first to avoid losing data
    const existingContent = readJson(outputFilePath) || {};
    // Merge with existing scope data (if any) to handle multiple files per scope
    const existingScopeData = existingContent[scope] || {};
    content = {
      ...existingContent,
      [scope]: { ...existingScopeData, ...content },
    };
  }

  writeJson(outputFilePath, content);
}
