#!/usr/bin/env node
'use strict';
const translationFiles = process.argv.slice(2);
const validator = require('./validator');

validator(translationFiles);
