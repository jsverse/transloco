#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import validator from './lib/transloco-validator';


const optionDefinitions: commandLineArgs.OptionDefinition[] = [
    { name: 'interpolationForbiddenChars', type: String, defaultValue: '{}' },
    { name: 'file', alias: 'f', type: String, multiple: true, defaultValue: [], defaultOption: true },
  ];

const { interpolationForbiddenChars, file } = commandLineArgs(optionDefinitions);
validator(interpolationForbiddenChars, file);
