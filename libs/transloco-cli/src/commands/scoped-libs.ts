import { getGlobalConfig } from '../config';
import { CliError } from '../errors';
import run from '../scoped-libs';

import { assertConfigPathExists } from './config-path';

export interface ScopedLibsCommandOptions {
  watch?: boolean;
  skipGitignore?: boolean;
  config?: string;
}

export async function runScopedLibs({
  watch = false,
  skipGitignore = false,
  config,
}: ScopedLibsCommandOptions) {
  assertConfigPathExists(config);

  const { rootTranslationsPath, scopedLibs } = getGlobalConfig(config);

  if (!scopedLibs?.length) {
    throw new CliError(
      'Transloco scoped-libs: Add the libraries to copy to "scopedLibs" in the Transloco config.',
    );
  }

  const problems: string[] = [];

  const stopWatching = await run({
    watch,
    skipGitIgnoreUpdate: skipGitignore,
    rootTranslationsPath,
    scopedLibs,
    // Every library is tried, a run that skipped one fails once the others are copied.
    // The watch mode keeps watching the libraries that are fine.
    onProblem: (problem) =>
      watch ? console.error(problem) : problems.push(problem),
  });

  // A watch that watches nothing would end silently with a success
  if (watch && stopWatching.watching === 0) {
    throw new CliError(
      'Transloco scoped-libs: Nothing could be watched, none of the libraries in "scopedLibs" were set up. See the problems above.',
    );
  }

  if (problems.length) {
    throw new CliError(problems.join('\n'));
  }
}
