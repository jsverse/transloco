#!/usr/bin/env node
import validator from './lib/transloco-validator.js';

const translationFilePaths = process.argv.slice(2);
validator(translationFilePaths);
