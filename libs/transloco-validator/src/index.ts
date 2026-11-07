#!/usr/bin/env node
import validator from '@jsverse/transloco-cli/internal/validator';

const translationFilePaths = process.argv.slice(2);
validator(translationFilePaths);
