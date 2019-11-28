const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

function mkRecursiveDirSync(dest) {
  if (fs.existsSync(dest)) {
    return;
  }
  dest.split(path.sep).reduce((prevPath, folder) => {
    const currentPath = path.join(prevPath, folder, path.sep);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
    return currentPath;
  }, '');
}

function toLinuxFormat(p) {
  return p.split(path.sep).join('/');
}

function cutPath(path, base = process.cwd()) {
  return toLinuxFormat(path).split(toLinuxFormat(process.cwd()))[1];
}

function getPackageJson(lib) {
  let pkgPath = path.join(process.cwd(), lib, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    pkgPath = path.resolve(path.join('node_modules', lib, 'package.json'));
  }

  return { path: pkgPath, content: readJson(pkgPath) };
}

function insertPathToGitIgnore(route) {
  const gitIgnorePath = path.resolve('.gitignore');
  const normalize = cutPath(route);
  let gitIgnore = fs.readFileSync(gitIgnorePath, 'utf8');
  if (gitIgnore.indexOf('\n' + normalize) === -1) {
    gitIgnore = `${gitIgnore}\n${normalize}`;
    fs.writeFileSync(gitIgnorePath, gitIgnore);
  }
}

function readJson(path) {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};
  } catch (e) {
    console.log(chalk.red(e));
    return null;
  }
}

function writeJson(path, content) {
  return fs.writeFileSync(path, JSON.stringify(content, null, 2), { encoding: 'utf8' });
}

function coerceArray(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function isString(val) {
  return typeof val === 'string';
}

module.exports = {
  mkRecursiveDirSync,
  toLinuxFormat,
  cutPath,
  getPackageJson,
  insertPathToGitIgnore,
  readJson,
  coerceArray,
  isString,
  writeJson
};
