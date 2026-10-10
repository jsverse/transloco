import fs from 'node:fs';
import path from 'node:path';

import { contains, locate } from '../utils/real-path.js';

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

  if (!fs.statSync(target.existing).isDirectory()) {
    return `The translations path ${value} is, or lies inside, a file`;
  }

  return undefined;
}
