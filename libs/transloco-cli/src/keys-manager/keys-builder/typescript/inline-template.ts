import { ExtractorConfig } from '../../types.js';
import { templateExtractor } from '../template/index.js';

import { SourceFileScan } from './scan-source-file.js';

export function inlineTemplateExtractor(
  { inlineTemplates }: SourceFileScan,
  config: ExtractorConfig,
) {
  for (const inlineTemplate of inlineTemplates) {
    templateExtractor({ ...config, content: inlineTemplate.text });
  }
}
