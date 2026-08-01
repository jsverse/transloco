import { SourceFile, Node } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import { buildKeysFromASTNodes } from './build-keys-from-ast-nodes';
import { TSExtractorResult } from './types';

export function signalExtractor(ast: SourceFile): TSExtractorResult {
  // workaround from https://github.com/estools/esquery/issues/68
  const [importNode] = tsquery(
    ast,
    `ImportDeclaration:has([text=/^@(jsverse|ngneat)\\x2Ftransloco/]):has(Identifier[name=translateSignal])`,
  );
  if (!importNode) {
    return [];
  }
  const signalName = getSignalName(importNode);
  const fns = tsquery(ast, `CallExpression Identifier[text=${signalName}]`);

  return buildKeysFromASTNodes(fns, [signalName]);
}

function getSignalName(importNode: Node) {
  const [defaultName, alias] = tsquery(
    importNode,
    'ImportSpecifier:has(Identifier[name=translateSignal]) Identifier',
  );
  return (alias || defaultName).getText();
}
