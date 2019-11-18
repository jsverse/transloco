#!/usr/bin/env node
'use strict';
const translocoUtils = require('@ngneat/transloco-utils');
const {run} = require('./index');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [{ name: 'watch', alias: 'w', type: Boolean, defaultValue: false }];
const cliParams = commandLineArgs(optionDefinitions);
const config = translocoUtils.getConfig();

run({
  watch: cliParams.watch,
  rootTranslationsPath: config.rootTranslationsPath,
  scopedLibs: config.scopedLibs
});
