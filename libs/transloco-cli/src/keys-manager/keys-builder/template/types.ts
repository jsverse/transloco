import { parseTemplate as ngParseTemplate } from '@angular/compiler';

import type { ExtractorConfig } from '../../types.js';

export interface TemplateExtractorConfig extends ExtractorConfig {
  content?: string;
  parsedTemplate?: ReturnType<typeof ngParseTemplate>;
}

export interface ContainersMetadata {
  containerContent: string;
  read?: string;
}
