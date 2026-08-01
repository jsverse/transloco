import { tsquery } from '@phenomnomnominal/tsquery';
import { SourceFile } from 'typescript';

import { ExtractorConfig } from '../../types';
import { templateExtractor } from '../template';

export function inlineTemplateExtractor(
  ast: SourceFile,
  config: ExtractorConfig,
) {
  const inlineTemplates = tsquery(
    ast,
    'ClassDeclaration Decorator CallExpression:has([name=Component]) ObjectLiteralExpression PropertyAssignment:has([name=template]) NoSubstitutionTemplateLiteral',
  );

  for (const inlineTemplate of inlineTemplates) {
    templateExtractor({ ...config, content: inlineTemplate.getText() });
  }
}
