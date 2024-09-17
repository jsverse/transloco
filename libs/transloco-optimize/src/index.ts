#!/usr/bin/env node
import commandLineArgs from 'command-line-args';

import {
  getTranslationFiles,
  optimizeFiles,
  getTranslationsFolder,
} from './lib/transloco-optimize';

const optionDefinitions: commandLineArgs.OptionDefinition[] = [
  { name: 'commentsKey', alias: 'k', type: String, defaultValue: 'comment' },
  { name: 'dist', alias: 'd', type: String, defaultOption: true },
];

const { dist, commentsKey } = commandLineArgs(optionDefinitions);

getTranslationFiles(dist)
  .then((filesPaths) => {
    if (filesPaths.length === 0) {
      return Promise.reject(
        `Transloco Optimize: No Translation path found under: ${getTranslationsFolder(
          dist,
        )}`,
      );
    }

    console.log(
      `Transloco Optimize: found ${filesPaths.length} translation files, optimizing...`,
    );

    return optimizeFiles(filesPaths, commentsKey);
  })
  .then(() => {
    console.log('Transloco Optimize: Done! 🎊 ');
  })
  .catch((err) => {
    console.warn(err);
  });
