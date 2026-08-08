#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import { optionDefinitions, sections } from './lib/cli-options';
import { buildTranslationFiles } from './lib/keys-builder';
import { findMissingKeys } from './lib/keys-detective';
import { Config } from './lib/types';
import { warnUnsupportedOptions } from './lib/utils/warn-unsupported-options';

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const mainOptions = commandLineArgs(mainDefinitions, {
  stopAtFirstUnknown: true,
});
const argv = mainOptions._unknown || [];

const config = commandLineArgs(optionDefinitions, {
  camelCase: true,
  argv,
});
const { help } = config;

if (help) {
  const usage = commandLineUsage(sections);
  // Don't delete, it's the help menu
  console.log(usage);
  process.exit();
}

const input = config.input
  ?.split(',')
  .map((path: string) => path.trim())
  .filter((path: string) => path.length > 0);

async function main() {
  if (config.input !== undefined && (!input || input.length === 0)) {
    console.error('Please provide at least one valid input path.');
    process.exitCode = 1;
    return;
  }

  const resolvedConfig = {
    ...config,
    command: mainOptions.command,
    ...(input ? { input } : {}),
  } as Config;

  if (resolvedConfig.command === 'extract') {
    warnUnsupportedOptions('extract', config);
    await buildTranslationFiles(resolvedConfig);
  } else if (resolvedConfig.command === 'find') {
    warnUnsupportedOptions('find', config);
    const { hasMissingKeys, hasExtraKeys } = findMissingKeys(resolvedConfig);
    if (hasMissingKeys) {
      process.exitCode = 1;
    } else if (hasExtraKeys) {
      process.exitCode = 2;
    }
  } else {
    console.log(`Please provide an action...`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
