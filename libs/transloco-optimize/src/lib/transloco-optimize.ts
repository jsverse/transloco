import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';
import { flatten } from 'flat';

type Translation = Record<string, any>;

function removeComments(translation: Translation, commentsKey = 'comment') {
  return Object.keys(translation).reduce((acc, key) => {
    const lastKey = key.split('.').pop();

    if (lastKey !== commentsKey) {
      acc[key] = translation[key];
    }

    return acc;
  }, {} as Translation);
}

export function getTranslationsFolder(dist: string) {
  return path.resolve(process.cwd(), dist);
}

export function getTranslationFiles(dist: string) {
  const filesMatcher = path.resolve(getTranslationsFolder(dist), '**/*.json');

  return promisify(glob)(filesMatcher, {});
}

export function optimizeFiles(translationPaths: string[], commentsKey: string) {
  return new Promise<void>((resolve, reject) => {
    let error;

    for (const path of translationPaths) {
      try {
        const translation = fs.readFileSync(path, { encoding: 'utf8' });
        const asObject = JSON.parse(translation);
        const flatObject = flatten(asObject, { safe: true }) as Translation;
        const optimized = JSON.stringify(
          removeComments(flatObject, commentsKey)
        );
        fs.writeFileSync(path, optimized, { encoding: 'utf8' });
      } catch (err) {
        error = err;
        break;
      }
    }

    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
}
