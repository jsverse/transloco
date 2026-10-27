import { FileFormats } from '../types.js';
import { normalizedGlob } from '../utils/normalize-glob-path.js';
import { isTranslationFile } from '../utils/path.utils.js';

export function getTranslationFilesPath(
  path: string,
  fileFormat: FileFormats,
): string[] {
  return normalizedGlob(`${path}/**/*.${fileFormat}`).filter((file) =>
    isTranslationFile(file, fileFormat),
  );
}
