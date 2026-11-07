import { FileFormats } from '../types';
import { normalizedGlob } from '../utils/normalize-glob-path';
import { isTranslationFile } from '../utils/path.utils';

export function getTranslationFilesPath(
  path: string,
  fileFormat: FileFormats,
): string[] {
  return normalizedGlob(`${path}/**/*.${fileFormat}`).filter((file) =>
    isTranslationFile(file, fileFormat),
  );
}
