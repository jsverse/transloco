#!/usr/bin/env node
import { warnDeprecatedBin } from '@jsverse/transloco-cli/internal/deprecation';

import validator from './lib/transloco-validator.js';

warnDeprecatedBin('transloco-validator');

const translationFilePaths = process.argv.slice(2);
validator(translationFilePaths);
