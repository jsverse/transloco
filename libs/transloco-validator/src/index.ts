#!/usr/bin/env node
import validator from './lib/transloco-validator';

const translationFilePaths = process.argv.slice(2);
validator(translationFilePaths);
