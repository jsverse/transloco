#!/usr/bin/env node
'use strict';
const translocoUtils = require('@ngneat/transloco-utils');
const path = require('path');
const copyScopeTranslationFiles = require('./index');
const utils = require('./utils');
const glob = require('glob');
const fs = require('fs');
const chokidar = require('chokidar');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [{ name: 'watch', alias: 'w', type: Boolean, defaultValue: false }];

const cliParams = commandLineArgs(optionDefinitions);

const config = translocoUtils.getConfig();

/**
 *
 * TODO:
 * - Add scopedLibs to TranslocoUtils types
 * - Check if it exists
 * - Test it with a library that exists in node_modules
 * - Use `for of` when you don't need the index. It's cleaner and you don't need a callback
 * - Add a script in our main `package.json` so we can test it
 */
config.scopedLibs.forEach(lib => {
  const pkg = getPackageJson(lib);
  if (!pkg.content.i18n) {
    throw new Error('package.json is missing i18n information.');
  }
  // TODO throw if they didn't pass rootTranslationsPath
  const output = path.resolve(config.rootTranslationsPath);

  const input = path.dirname(pkg.path);

  // TOOD: what is .scope? It should look like this:
  /**
   * {
   *   i18n: {
   *     scope: path,
   *     scope: path
   *   }
   * }
   */
  const scopeDir = path.join(output, pkg.content.i18n.scope);

  utils.mkRecursiveDirSync(output, pkg.content.i18n.scope);

  glob(`${path.join(input, pkg.content.i18n.path)}/**/*.json`, {}, function(er, files) {
    // TODO: if error throw it

    copyScopeTranslationFiles(files, scopeDir);
    if (cliParams.watch) {
      chokidar
        .watch(files)
        .on('add', file => copyScopeTranslationFiles([file], scopeDir))
        .on('change', file => {
          copyScopeTranslationFiles([file], scopeDir);
        });
    }
  });
});

function getPackageJson(lib) {
  let pkgPath = path.join(process.cwd(), lib, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    pkgPath = path.resolve(path.join('node_modules', lib, 'package.json'));
  }
  const file = fs.readFileSync(pkgPath);
  // TODO: throw a msg if it doesn't exists
  return { path: pkgPath, content: file ? JSON.parse(file) : null };
}
