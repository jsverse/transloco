import ts, {
  CallExpression,
  Node,
  StringLiteral,
  NoSubstitutionTemplateLiteral,
} from 'typescript';
import { flatten } from 'flat';

import { TSExtractorResult } from './types';

/**
 * Resolve the keys of a `translate`-like call from its
 * `(key | key[], params?, lang?)` arguments.
 */
export function buildKeysFromCall(call: CallExpression): TSExtractorResult {
  const [keyNode, paramsNode, langNode] = call.arguments;
  const lang = isStringNode(langNode) ? langNode.text : '';
  const params: string[] =
    paramsNode && ts.isObjectLiteralExpression(paramsNode)
      ? resolveParams(paramsNode)
      : [];

  let keys: string[] = [];
  if (isStringNode(keyNode)) {
    keys = [keyNode.text];
  } else if (keyNode && ts.isArrayLiteralExpression(keyNode)) {
    keys = keyNode.elements.filter(isStringNode).map((node) => node.text);
  }

  return keys.map((key) => ({ key, lang, params }));
}

function isStringNode(
  node: Node | undefined,
): node is StringLiteral | NoSubstitutionTemplateLiteral {
  return (
    !!node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
  );
}

function resolveParams(params: ts.ObjectLiteralExpression): string[] {
  return Object.keys(flatten(traverseParams(params)));
}

function traverseParams(
  params: ts.ObjectLiteralExpression,
): Record<string, any> {
  const properties: Record<string, any> = {};

  for (const property of params.properties) {
    if (!ts.isPropertyAssignment(property)) continue;

    const key = property.name.getText().replace(/['"]/g, '');
    const initializer = property.initializer;

    properties[key] = ts.isObjectLiteralExpression(initializer)
      ? traverseParams(initializer)
      : initializer.getText();
  }

  return properties;
}
