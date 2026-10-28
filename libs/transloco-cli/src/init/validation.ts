import fs from 'node:fs';
import path from 'node:path';

import { contains, locate, lstat, specialKind } from '../utils/real-path.js';

/** A language is the name of the file written for it, which rules these out. */
const notInFileName = /[\\/:*?"<>|\0\s]/;

/** What is wrong with the language, `undefined` when it can be used. */
export function languageProblem(lang: string) {
  if (lang === '') {
    return 'A language cannot be empty';
  }

  if (lang === '.' || lang === '..' || notInFileName.test(lang)) {
    return `'${lang}' cannot be used as a language, it is the name of a translation file`;
  }

  return undefined;
}

/** The languages of an answer: separated by spaces or commas, each one once. */
export function parseLanguages(answer: string) {
  return [...new Set(answer.split(/[\s,]+/).filter(Boolean))];
}

/**
 * What is wrong with the translations path, `undefined` when it can be used.
 * The translation files are written below it, so it has to stay inside the
 * working directory. A link can lead anywhere, which is why this is judged on
 * real paths.
 */
export function translationsPathProblem(value: string, cwd = process.cwd()) {
  const trimmed = value.trim();

  if (trimmed === '') {
    return 'The translations path cannot be empty';
  }

  const outside = `The translations path ${value} must be inside the current directory`;
  let target: ReturnType<typeof locate>;

  try {
    target = locate(path.resolve(cwd, trimmed));
  } catch {
    return outside;
  }

  if (target.unresolvable) {
    return `The real location of the translations path ${value} cannot be resolved`;
  }

  if (!contains(fs.realpathSync(cwd), target.real)) {
    return outside;
  }

  const stats = nearestStats(target.existing);

  if (!stats.isDirectory()) {
    return `The translations path ${value} is, or lies inside, ${specialKind(stats) ?? 'a file'}`;
  }

  return undefined;
}

/**
 * Why something that is there can't be read or written as a file, `undefined`
 * when it is a file, a folder, a link to either, or isn't there. The ones
 * that are neither make whoever opens them wait. A link that leads nowhere is
 * left to `writeProblem`.
 */
export function specialFileProblem(target: string) {
  const stats = statOrUndefined(target);
  const kind = stats && specialKind(stats);

  if (!kind) return undefined;

  return lstat(target)?.isSymbolicLink()
    ? `it is a link to ${kind}`
    : `it is ${kind}`;
}

/**
 * Why the file can't be written, `undefined` when it can: it is there and
 * writable, or the folder it goes in can be made below the deepest folder that
 * exists and takes new entries. The reason reads after the file name.
 */
export function writeProblem(file: string, cwd = process.cwd()) {
  const target = path.resolve(cwd, file);

  if (lstat(target)) {
    // A link is followed, as the write goes through it
    const stats = statOrUndefined(target);

    if (!stats) return 'it is a link that leads nowhere';

    if (stats.isDirectory()) return 'it is a folder';

    // Writing to a FIFO waits for a reader
    if (!stats.isFile()) return `it is ${specialKind(stats) ?? 'not a file'}`;

    return can(target, fs.constants.W_OK) ? undefined : 'it is read-only';
  }

  // Below a file the name is no more there than below a missing folder
  let ancestor = path.dirname(target);

  while (!lstat(ancestor)) {
    ancestor = path.dirname(ancestor);
  }

  const name = path.relative(cwd, ancestor) || '.';
  const stats = statOrUndefined(ancestor);

  if (!stats) return `${name} is a link that leads nowhere`;

  if (!stats.isDirectory())
    return `${name} is ${specialKind(stats) ?? 'a file'}`;

  return can(ancestor, fs.constants.W_OK | fs.constants.X_OK)
    ? undefined
    : `the folder ${name} is read-only`;
}

/**
 * What the path is, or the closest thing above it that can be looked at: a
 * link may lead to a file, and nothing lies below a file.
 */
function nearestStats(target: string): fs.Stats {
  for (let current = target; ; current = path.dirname(current)) {
    try {
      return fs.statSync(current);
    } catch (error) {
      if (path.dirname(current) === current) throw error;
    }
  }
}

function statOrUndefined(target: string) {
  try {
    return fs.statSync(target);
  } catch {
    return undefined;
  }
}

function can(target: string, mode: number) {
  try {
    fs.accessSync(target, mode);

    return true;
  } catch {
    return false;
  }
}
