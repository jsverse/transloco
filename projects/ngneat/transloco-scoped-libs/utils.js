const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

function mkRecursiveDirSync(entry, src) {
  if (fs.existsSync(path.join(entry, src))) {
    return;
  }
  const folders = src.split(path.sep);
  folders.forEach(folder => {
    entry = path.join(entry, folder);
    fs.mkdirSync(entry);
  });
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
  if (gitIgnore.indexOf(normalize) === -1) {
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

module.exports = {
  mkRecursiveDirSync, toLinuxFormat, cutPath, getPackageJson, insertPathToGitIgnore, readJson, writeJson
};
