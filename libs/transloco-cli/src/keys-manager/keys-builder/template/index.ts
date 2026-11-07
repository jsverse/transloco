import { parseTemplate as ngParseTemplate } from '@angular/compiler';

import { Config, ExtractionResult } from '../../types';
import { readFile } from '../../utils/file.utils';
import { extractKeys } from '../utils/extract-keys';

import { TemplateExtractorConfig } from './types';
import { templateCommentsExtractor } from './comments.extractor';
import { directiveExtractor } from './directive.extractor';
import { pipeExtractor } from './pipe.extractor';
import { structuralDirectiveExtractor } from './structural-directive.extractor';

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
