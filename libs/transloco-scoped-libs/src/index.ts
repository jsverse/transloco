#!/usr/bin/env node
import { getGlobalConfig } from '@jsverse/transloco-cli';
import { warnDeprecatedBin } from '@jsverse/transloco-cli/internal/deprecation';
import commandLineArgs from 'command-line-args';

import run from './lib/transloco-scoped-libs.js';

warnDeprecatedBin('transloco-scoped-libs');

const optionDefinitions: commandLineArgs.OptionDefinition[] = [
  { name: 'watch', alias: 'w', type: Boolean, defaultValue: false },
  { name: 'skip-gitignore', alias: 'm', type: Boolean, defaultValue: false },
];
const { watch, ['skip-gitignore']: skipGitIgnoreUpdate } =
  commandLineArgs(optionDefinitions);
const { rootTranslationsPath, scopedLibs } = getGlobalConfig();

run({
  watch,
  skipGitIgnoreUpdate,
  rootTranslationsPath,
  scopedLibs,
});
