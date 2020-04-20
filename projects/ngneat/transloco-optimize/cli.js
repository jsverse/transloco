#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const optimize = require('./index');

const optionDefinitions = [
  { name: 'commentsKey', alias: 'k', type: String, defaultValue: 'comment' },
  { name: 'dist', alias: 'd', type: String, defaultOption: true }
];

const cliParams = commandLineArgs(optionDefinitions);

optimize(cliParams);
