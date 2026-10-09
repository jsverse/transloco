import { FileFormats } from '../types.js';
import { normalizedGlob } from '../utils/normalize-glob-path.js';

export function getTranslationFilesPath(
  path: string,
  fileFormat: FileFormats,
): string[] {
  return normalizedGlob(`${path}/**/*.${fileFormat}`);
}
