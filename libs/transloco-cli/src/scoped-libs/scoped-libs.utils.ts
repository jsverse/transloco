import path from 'node:path';
import fs from 'fs';

import { readJsonFile, writeJsonFile } from '../utils/file-system.js';
import { style } from '../utils/style.js';

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

export function insertPathToGitIgnore(route: string) {
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
    return fs.existsSync(path) ? readJsonFile(path) : {};
  } catch (e) {
    console.log(style('red', e));

    return null;
  }
}

export function writeJson(path: string, content: string) {
  writeJsonFile(path, content, 2);
}

export function coerceArray<T>(val: T): T[] {
  if (val == null) return [];

  return Array.isArray(val) ? val : [val];
}

export function isString(val: unknown): val is string {
  return typeof val === 'string';
}
