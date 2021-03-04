const path = require('path');
const utils = require('./utils');
const chalk = require('chalk');
const glob = require('glob');
const chokidar = require('chokidar');
const translocoUtils = require('@ngneat/transloco-utils');
const config = translocoUtils.getConfig();

let scopeFilesMap = [];
const example = `
  e.g:
  module.exports = {
    scopedLibs: [{
      src: './projects/core',
      dist: ['./projects/spa/src/assets/i18n', './src/assets/i18n/']
    }]
  };
`;

const i18nExample = `
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
 *
 * @param {
 *  watch: boolean,
 *  rootTranslationsPath: string,
 *  scopedLibs: (string | {src: string. dist: string | string[]})[]
 * }
 *
 * watch - if true the script will run in watch mode
 * skipGitignore - if false tries to add an entry to the .gitignore for each of the translation files
 * rootTranslationsPath - the root directory of the translation files.
 * scopedLibs - list of all translation scoped project paths.
 */
function run({ watch, skipGitignore, rootTranslationsPath, scopedLibs } = {}) {
  const defaultTranslationPath = rootTranslationsPath || config.rootTranslationsPath;

  scopedLibs = coerceScopedLibs(scopedLibs || config.scopedLibs, defaultTranslationPath);

  const startMsg = watch ? 'Running Transloco Scoped Libs in watch mode' : 'Starting Transloco Scoped Libs...';
  console.log(chalk.magenta(startMsg));

  for (let lib of scopedLibs) {
    if (!lib.src) {
      return console.log(chalk.red(`Please specify the library's src.`, example));
    }
    const pkg = utils.getPackageJson(lib.src);
    if (!pkg.content.i18n) {
      return console.log(chalk.red(`${path.join(lib.src, 'package.json')} is missing i18n information.`, i18nExample));
    }

    if (!lib.dist || lib.dist.length === 0) {
      return console.log(
        chalk.red(
          'please specify dist path, by either set "rootTranslationsPath" or specify the "dist" for each library',
          example
        )
      );
    }

    const outputs = lib.dist.map(o => path.resolve(o));
    const input = path.dirname(pkg.path);
    for (let scopeConfig of pkg.content.i18n) {
      glob(`${path.join(input, scopeConfig.path)}/**/*.json`, {}, function(err, files) {
        if (err) console.log(chalk.red(err));

        for (let output of outputs) {
          // save the files with the scope to provide an API for the webpack loader.
          scopeFilesMap.push({ scopeConfig, files, output });
          copyScopes(output, scopeConfig.scope, files, scopeConfig.strategy, skipGitignore);
        }

        if (watch) {
          chokidar
            .watch(files)
            .on('change', file =>
              outputs.forEach(output => copyScopes(output, scopeConfig.scope, [file], scopeConfig.strategy))
            );
        }
      });
    }
  }
}

function coerceScopedLibs(scopedLibs, defaultPath) {
  if (!scopedLibs || scopedLibs.length === 0) {
    return console.log(chalk.red('Please add "scopedLibs" configuration in transloco.config.js file.', example));
  }
  return scopedLibs.map(lib =>
    utils.isString(lib) ? { src: lib, dist: [defaultPath] } : { ...lib, dist: utils.coerceArray(lib.dist) }
  );
}

function onFilesChanged(filePaths) {
  for (let filePath of filePaths) {
    const scope = getScopeFromFile(filePath);
    scope && copyScopes(scope.output, scope.scope, [file], scope.strategy);
  }
}

function getScopeFromFile(filePath) {
  return scopeFilesMap.find(scope => scope.files.includes(filePath));
}

function copyScopes(outputDir, scope, files, strategy, skipGitignore) {
  if (strategy === 'join') {
    copyScopeTranslationFiles(files, outputDir, strategy, '.vendor.json', scope, skipGitignore);
  } else {
    const dest = path.join(outputDir, scope);
    utils.mkRecursiveDirSync(dest, scope);
    copyScopeTranslationFiles(files, dest, strategy, '.json', scope, skipGitignore);
  }
}

function copyScopeTranslationFiles(files, destinationPath, strategy, extension, scopeName, skipGitignore) {
  for (let filePath of files) {
    const normalized = path.normalize(filePath);
    const lang = path.basename(normalized).split('.')[0];
    const fileName = lang + extension;
    const dest = path.join(destinationPath, fileName);

    console.log(
      '✅ Copy translation from file:',
      chalk.blue(utils.cutPath(normalized)),
      'to:',
      chalk.blue(utils.cutPath(dest))
    );

    if (!skipGitignore) {
      if (strategy === 'join') {
        utils.insertPathToGitIgnore(dest);
      } else {
        utils.insertPathToGitIgnore(destinationPath);
      }
    }

    setTranslationFile(normalized, dest, strategy, scopeName);
  }
}

function setTranslationFile(file, dest, strategy, scopeName) {
  let content = utils.readJson(file);
  if (!content) {
    return;
  }

  if (strategy === 'join') {
    content = { ...utils.readJson(dest), [scopeName]: content };
  }
  utils.writeJson(dest, content);
}

module.exports = { run, onFilesChanged };
