#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import { optionDefinitions, sections } from './lib/cli-options';
import { getConfig } from './lib/config';
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

const inputPaths = config.input
  ?.split(',')
  .map((path: string) => path.trim())
  .filter(Boolean);

if (config.input && !inputPaths.length) {
  console.error('The "input" option must contain at least one valid path.');
  process.exit(1);
}

const resolvedConfig = {
  ...config,
  command: mainOptions.command,
  ...(inputPaths?.length ? { input: inputPaths } : {}),
} as Config;

async function run() {
  if (resolvedConfig.command === 'extract') {
    warnUnsupportedOptions('extract', config);
    await buildTranslationFiles(resolvedConfig);
  } else if (resolvedConfig.command === 'find') {
    warnUnsupportedOptions('find', config);
    const { hasMissingKeys, hasExtraKeys } = findMissingKeys(resolvedConfig);
    // Read the resolved config, the flags may come from `transloco.config.js`.
    const { addMissingKeys, emitErrorOnExtraKeys } = getConfig();

    if (hasMissingKeys && !addMissingKeys) {
      process.exitCode = 1;
    } else if (hasExtraKeys && emitErrorOnExtraKeys) {
      process.exitCode = 2;
    }
  } else {
    console.log(`Please provide an action...`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
