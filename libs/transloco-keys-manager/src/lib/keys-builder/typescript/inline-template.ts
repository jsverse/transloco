import { tsquery } from '@phenomnomnominal/tsquery';
import { SourceFile } from 'typescript';

import { ExtractorConfig } from '../../types';
import { templateExtractor } from '../template';

export function inlineTemplateExtractor(
  ast: SourceFile,
  config: ExtractorConfig,
) {
  const [inlineTemplate] = tsquery(
    ast,
    'ClassDeclaration Decorator CallExpression:has([name=Component]) ObjectLiteralExpression PropertyAssignment:has([name=template]) NoSubstitutionTemplateLiteral',
  );

  if (inlineTemplate) {
    templateExtractor({ ...config, content: inlineTemplate.getText() });
  }
}
