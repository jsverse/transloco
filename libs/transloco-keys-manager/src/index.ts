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

const resolvedConfig = {
  ...config,
  command: mainOptions.command,
  ...(config.input ? { input: config.input.split(',') } : {}),
} as Config;

if (resolvedConfig.command === 'extract') {
  warnUnsupportedOptions('extract', config);
  buildTranslationFiles(resolvedConfig);
} else if (resolvedConfig.command === 'find') {
  warnUnsupportedOptions('find', config);
  findMissingKeys(resolvedConfig);
} else {
  console.log(`Please provide an action...`);
}
