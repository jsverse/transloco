import fs from 'node:fs';
import path from 'node:path';

import { glob } from 'glob';
import { flatten } from 'flat';

import { removeComments } from './remove-comments';

type Translation = Record<string, string>;

const isWindows = process.platform === 'win32';

export { removeComments };

export function getTranslationsFolder(dist: string) {
  return path.resolve(process.cwd(), dist);
}

export function getTranslationFiles(dist: string) {
  const filesMatcher = path.resolve(getTranslationsFolder(dist), '**/*.json');

  return glob(filesMatcher, { windowsPathsNoEscape: isWindows });
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
          removeComments(flatObject, commentsKey),
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
