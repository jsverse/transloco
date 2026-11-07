import { getGlobalConfig } from '../config';
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

  await run({
    watch,
    skipGitIgnoreUpdate: skipGitignore,
    rootTranslationsPath,
    scopedLibs,
  });
}
