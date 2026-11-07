import { FileFormats } from '../types';
import { normalizedGlob } from '../utils/normalize-glob-path';

export function getTranslationFilesPath(
  path: string,
  fileFormat: FileFormats,
): string[] {
  return normalizedGlob(`${path}/**/*.${fileFormat}`);
}
