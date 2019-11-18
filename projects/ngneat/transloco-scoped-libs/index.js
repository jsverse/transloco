const path = require('path');
const utils = require('./utils');
const chalk = require('chalk');
const glob = require('glob');
const chokidar = require('chokidar');

let scopeFilesMap = [];

/**
 *
 * @param {{watch: boolean, rootTranslationsPath: string, scopedLibs: string[]}}
 *
 * watch - if true the script will run in watch mode
 * rootTranslationsPath - the root directory of the translation files.
 * scopedLibs - list of all translation scoped project paths.
 */
function run({ watch, rootTranslationsPath, scopedLibs }) {
  if (!rootTranslationsPath) {
    return console.log(chalk.red('please specify "rootTranslationsPath" in transloco.config.js file.'));
  }
  if (!scopedLibs || scopedLibs.length === 0) {
    return console.log(chalk.red('Please add "scopedLibs" configuration in transloco.config.js file.'));
  }

  const startMsg = watch ? 'Run in watch mode' : 'Script start';
  console.log(chalk.green(startMsg));

  for (let lib of scopedLibs) {
    const pkg = utils.getPackageJson(lib);
    if (!pkg.content.i18n) {
      return console.log(chalk.red('package.json is missing i18n information.'));
    }

    const output = path.resolve(rootTranslationsPath);
    const input = path.dirname(pkg.path);
    for (let scopeConfig of pkg.content.i18n) {
      glob(`${path.join(input, scopeConfig.path)}/**/*.json`, {}, function(err, files) {
        if (err) console.log(chalk.red(err));
        // save the files with the scope to provide an API for the webpack loader.
        scopeFilesMap.push({scopeConfig, files, output});

        copyScopes(output, scopeConfig.scope, files, scopeConfig.strategy);
        if (watch) {
          chokidar
            .watch(files)
            .on('change', file => copyScopes(output, scopeConfig.scope, [file], scopeConfig.strategy));
        }
      });
    }
  }
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

function copyScopes(outputDir, scope, files, strategy) {
  if (strategy === 'join') {
    copyScopeTranslationFiles(files, outputDir, strategy, '.vendor.json', scope);
  } else {
    utils.mkRecursiveDirSync(outputDir, scope);
    copyScopeTranslationFiles(files, path.join(outputDir, scope), strategy, '.json', scope);
  }
}

function copyScopeTranslationFiles(files, destinationPath, strategy, extension, scopeName) {
  for (let filePath of files) {
    const normalized = path.normalize(filePath);
    const lang = path.basename(normalized).split('.')[0];
    const fileName = lang + extension;
    const dest = path.join(destinationPath, fileName);

    console.log(
      'copy translation from file:',
      chalk.cyan(utils.cutPath(normalized)),
      'to:',
      chalk.cyan(utils.cutPath(dest))
    );

    if (strategy === 'join') {
      utils.insertPathToGitIgnore(dest);
    } else {
      utils.insertPathToGitIgnore(destinationPath);
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

module.exports = {run, onFilesChanged};
