#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { warnDeprecatedBin } from '@jsverse/transloco-cli/internal/deprecation';
import {
  buildTranslationFiles,
  Config,
  findMissingKeys,
  optionDefinitions,
  sections,
  warnUnsupportedOptions,
} from '@jsverse/transloco-cli/internal/keys-manager';

// The action may follow options, so it's looked up the way the parser below finds it
let action: string | undefined;
try {
  ({ command: action } = commandLineArgs(
    [{ name: 'command', defaultOption: true }, ...optionDefinitions],
    { camelCase: true, partial: true },
  ));
} catch {
  // An invalid option set (e.g. a repeated --input) fails the parse below as it always did, after the notice
}

warnDeprecatedBin('transloco-keys-manager', action);

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
