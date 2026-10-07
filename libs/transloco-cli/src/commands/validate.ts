import { CliError } from '../errors.js';
import validator from '../validator/index.js';

/** Validates every file, so that a single run reports all the invalid ones. */
export function runValidate(translationFilePaths: string[]) {
  const problems: string[] = [];

  for (const path of translationFilePaths) {
    try {
      validator([path]);
    } catch (error) {
      problems.push(describeProblem(error, path));
    }
  }

  if (problems.length) {
    throw new CliError(problems.join('\n'));
  }
}

function describeProblem(error: unknown, path: string) {
  // A syntax error may quote the offending part of the file, line breaks included.
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/\s*\n\s*/g, ' ')
    .trim();

  // The validator ends its own message with the file, and a failure to open
  // the file quotes it. Any other error doesn't know which file it is about,
  // and one that merely contains the path somewhere doesn't name it either.
  const namesTheFile =
    message.endsWith(`(${path})`) ||
    ((error as NodeJS.ErrnoException).path === path &&
      message.includes(`'${path}'`));

  return namesTheFile ? message : `${message} (${path})`;
}
