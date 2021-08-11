import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import chalk from 'chalk';

export function toLinuxFormat(p: string) {
  return p.split(path.sep).join('/');
}

export function cutPath(path: string) {
  return toLinuxFormat(path).split(toLinuxFormat(process.cwd()))[1];
}

export function getPackageJson(lib: string) {
  let pkgPath = path.join(process.cwd(), lib, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    pkgPath = path.resolve(path.join('node_modules', lib, 'package.json'));
  }

  return { path: pkgPath, content: readJson(pkgPath) };
}

export function insertPathToGitIgnore(route) {
  const gitIgnorePath = path.resolve('.gitignore');

  if (!fs.existsSync(gitIgnorePath)) {
    return;
  }

  const normalize = cutPath(route);
  let gitIgnore = fs.readFileSync(gitIgnorePath, 'utf8');
  if (gitIgnore.indexOf('\n' + normalize) === -1) {
    gitIgnore = `${gitIgnore}\n${normalize}`;
    fs.writeFileSync(gitIgnorePath, gitIgnore);
  }
}

export function readJson(path: string) {
  try {
    return fsExtra.readJSONSync(path, {encoding: 'utf8'});
  } catch (e) {
    console.log(chalk.red(e));

    return null;
  }
}

export function writeJson(path: string, content: string) {
  fsExtra.writeJSONSync(path, content, {spaces: 2, encoding: 'utf8'});
}

export function coerceArray<T>(val: T): T[] {
  if (val == null) return [];

  return Array.isArray(val) ? val : [val];
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}
