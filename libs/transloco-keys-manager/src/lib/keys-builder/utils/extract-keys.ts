import {
  Config,
  ExtractionResult,
  ExtractorConfig,
  FileType,
  ScopeMap,
} from '../../types';
import { initExtraction } from '../../utils/init-extraction';
import { devlog } from '../../utils/logger';
import { normalizedGlob } from '../../utils/normalize-glob-path';

export function extractKeys(
  { input, scopes, defaultValue, files }: Config,
  fileType: FileType,
  extractor: (config: ExtractorConfig) => ScopeMap,
): ExtractionResult {
  let { scopeToKeys } = initExtraction();

  const fileList =
    files ||
    input.map((path) => normalizedGlob(`${path}/**/*.${fileType}`)).flat();

  for (const file of fileList) {
    devlog('extraction', 'Extracting keys', { file, fileType });
    scopeToKeys = extractor({ file, defaultValue, scopes, scopeToKeys });
  }

  return { scopeToKeys, fileCount: fileList.length };
}
