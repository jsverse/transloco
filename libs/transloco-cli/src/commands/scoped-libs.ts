import { getGlobalConfig } from '../config/index.js';
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

  await run({
    watch,
    skipGitIgnoreUpdate: skipGitignore,
    rootTranslationsPath,
    scopedLibs,
  });
}
