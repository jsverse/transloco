import { ExtractorConfig } from '../../types';
import { templateExtractor } from '../template';

import { SourceFileScan } from './scan-source-file';

export function inlineTemplateExtractor(
  { inlineTemplates }: SourceFileScan,
  config: ExtractorConfig,
) {
  for (const inlineTemplate of inlineTemplates) {
    templateExtractor({ ...config, content: inlineTemplate.text });
  }
}
