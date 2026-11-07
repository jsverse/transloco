#!/usr/bin/env node
import { warnDeprecatedBin } from '@jsverse/transloco-cli/internal/deprecation';
import validator from '@jsverse/transloco-cli/internal/validator';

warnDeprecatedBin('transloco-validator');

const translationFilePaths = process.argv.slice(2);
validator(translationFilePaths);
