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

if (!config.scopedLibs || config.scopedLibs.length === 0) {
  throw new Error('please add "scopedLibs" configuration in transloco.config.js file.');
}
for (let lib of config.scopedLibs) {
  const pkg = getPackageJson(lib);
  if (!pkg.content.i18n) {
    throw new Error('package.json is missing i18n information.');
  }

  if (!config.rootTranslationsPath) {
    throw new Error('please specify "rootTranslationsPath" in transloco.config.js file.');
  }

  const output = path.resolve(config.rootTranslationsPath);
  const input = path.dirname(pkg.path);

  getScopesFiles(input, output, pkg.content.i18n)
    .then(scopeFilesArr => {
      run(output, scopeFilesArr);
      if (cliParams.watch) {
        watch(scopeFilesArr);
      }
    })
    .catch(err => console.error(err));
}

function run(outputDir, scopeFilesArr) {
  for (let scope of scopeFilesArr) {
    utils.mkRecursiveDirSync(outputDir, scope.name);
    copyScopeTranslationFiles(scope.files, scope.dir);
  }
}

function watch(scopeFilesArr) {
  const files = scopeFilesArr.reduce((acc, cur) => acc.concat(cur.files), []);
  chokidar.watch(files).on('change', file => reRunOnChange(scopeFilesArr, file));
}

function reRunOnChange(scopeFilesArr, file) {
  console.log(`copy content from file: ${file}`);
  const unixFormatted = utils.toLinuxFormat(file);
  const scope = scopeFilesArr.find(scope => scope.files.includes(unixFormatted));
  copyScopeTranslationFiles([unixFormatted], scope.dir);
}

function getScopesFiles(input, output, scopes) {
  const acc = [];
  let counter = 0;

  return new Promise((res, rej) => {
    for (let scope of scopes) {
      glob(`${path.join(input, scope.path)}/**/*.json`, {}, function(err, files) {
        if (err) {
          return rej(err);
        }
        counter++;
        acc.push({ name: scope.scope, dir: path.join(output, scope.scope), files: files });
        if (counter === scopes.length) {
          res(acc);
        }
      });
    }
  });
}

function getPackageJson(lib) {
  let pkgPath = path.join(process.cwd(), lib, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    pkgPath = path.resolve(path.join('node_modules', lib, 'package.json'));
  }
  const file = fs.readFileSync(pkgPath);
  return { path: pkgPath, content: file ? JSON.parse(file) : null };
}
