import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import run from '../scoped-libs/index.js';

import { assertConfigPathExists } from './config-path.js';

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

  await run({
    watch,
    skipGitIgnoreUpdate: skipGitignore,
    rootTranslationsPath,
    scopedLibs,
    // Every library is tried, a run that skipped one fails once the others are copied.
    // The watch mode keeps watching the libraries that are fine.
    onProblem: (problem) =>
      watch ? console.error(problem) : problems.push(problem),
  });

  if (problems.length) {
    throw new CliError(problems.join('\n'));
  }
}
