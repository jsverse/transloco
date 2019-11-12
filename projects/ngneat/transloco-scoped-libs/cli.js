#!/usr/bin/env node
'use strict';
const translocoUtils = require("@ngneat/transloco-utils");
const path = require("path");
const copyTranslationFiles = require("./index");
const fs = require('fs');

const config = translocoUtils.getConfig();
config.scopedLibs.forEach(lib => {
  const pkg = getPackageJson(lib);
  // TODO: asserts.
  copyTranslationFiles(
    path.dirname(pkg.path),
    config.rootTranslationsPath,
    pkg.content.i18n.path,
    pkg.content.i18n.scope
  )
});

function getPackageJson(lib) {
  //TODO: support node_modules.
  const pkgPath = path.join(process.cwd(), lib, 'package.json');
  const file = fs.readFileSync(pkgPath);
  return {path: pkgPath, content: file ? JSON.parse(file) : null};
}
