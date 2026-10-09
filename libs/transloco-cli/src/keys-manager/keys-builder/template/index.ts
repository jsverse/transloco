import { parseTemplate as ngParseTemplate } from '@angular/compiler';

import { Config, ExtractionResult } from '../../types.js';
import { readFile } from '../../utils/file.utils.js';
import { extractKeys } from '../utils/extract-keys.js';

import { TemplateExtractorConfig } from './types.js';
import { templateCommentsExtractor } from './comments.extractor.js';
import { directiveExtractor } from './directive.extractor.js';
import { pipeExtractor } from './pipe.extractor.js';
import { structuralDirectiveExtractor } from './structural-directive.extractor.js';

export function extractTemplateKeys(config: Config): ExtractionResult {
  return extractKeys(config, 'html', templateExtractor);
}

export function templateExtractor(config: TemplateExtractorConfig) {
  const { file, scopeToKeys } = config;
  const content = config.content || readFile(file);
  if (!content.includes('transloco')) return scopeToKeys;

  // Parse template once and share across extractors
  const parsedTemplate = ngParseTemplate(content, file);
  const resolvedConfig = { ...config, content, parsedTemplate };
  pipeExtractor(resolvedConfig);
  templateCommentsExtractor(resolvedConfig);
  directiveExtractor(resolvedConfig);
  structuralDirectiveExtractor(resolvedConfig);

  return scopeToKeys;
}
