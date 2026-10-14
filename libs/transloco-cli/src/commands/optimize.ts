import { CliError } from '../errors.js';
import {
  getTranslationFiles,
  getTranslationsFolder,
  optimizeFiles,
} from '../optimize/index.js';

export interface OptimizeOptions {
  dist: string;
  commentsKey: string;
}

export async function runOptimize({ dist, commentsKey }: OptimizeOptions) {
  const filesPaths = await getTranslationFiles(dist);

  if (filesPaths.length === 0) {
    throw new CliError(
      `Transloco Optimize: No Translation path found under: ${getTranslationsFolder(
        dist,
      )}`,
    );
  }

  console.log(
    `Transloco Optimize: found ${filesPaths.length} translation files, optimizing...`,
  );

  await optimizeFiles(filesPaths, commentsKey);

  console.log('Transloco Optimize: Done! 🎊 ');
}
