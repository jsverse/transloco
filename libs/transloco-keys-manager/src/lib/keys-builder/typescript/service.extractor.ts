import { tsquery } from '@phenomnomnominal/tsquery';
import ts, { SourceFile } from 'typescript';

import { buildKeysFromASTNodes } from './build-keys-from-ast-nodes';
import { TSExtractorResult } from './types';

function buildInjectFunctionQuery(nodeType: string) {
  return `${nodeType}:has(CallExpression:has(Identifier[name=inject]):has(Identifier[name=TranslocoService]))`;
}

export function serviceExtractor(ast: SourceFile): TSExtractorResult {
  const constructorInjection =
    'Constructor Parameter:has(TypeReference Identifier[name=TranslocoService])';
  const injectFunction = ['PropertyDeclaration', 'VariableDeclaration'].map(
    buildInjectFunctionQuery,
  );
  const serviceNameQuery = [constructorInjection, injectFunction].join(',');
  const serviceNameNodes = tsquery(ast, serviceNameQuery);

  let result: TSExtractorResult = [];

  for (const serviceName of serviceNameNodes) {
    if (
      ts.isParameter(serviceName) ||
      ts.isPropertyDeclaration(serviceName) ||
      ts.isVariableDeclaration(serviceName)
    ) {
      const propName = serviceName.name.getText();
      const methodNodes = tsquery(
        ast,
        `PropertyAccessExpression:has([text="${propName}"])`,
      );

      result = result.concat(buildKeysFromASTNodes(methodNodes));
    }
  }

  return result;
}
