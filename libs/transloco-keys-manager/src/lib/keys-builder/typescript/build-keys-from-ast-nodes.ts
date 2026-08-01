import ts, {
  Node,
  StringLiteral,
  NoSubstitutionTemplateLiteral,
} from 'typescript';
import { flatten } from 'flat';

import { TSExtractorResult } from './types';

export function buildKeysFromASTNodes(
  nodes: Node[],
  allowedMethods = ['translate', 'selectTranslate'],
): TSExtractorResult {
  const result: TSExtractorResult = [];

  for (const node of nodes) {
    if (!ts.isCallExpression(node.parent)) continue;

    const method = node.parent.expression;
    let methodName = '';
    if (ts.isIdentifier(method)) {
      methodName = method.text;
    } else if (ts.isPropertyAccessExpression(method)) {
      methodName = method.name.text;
    }
    if (!allowedMethods.includes(methodName)) {
      continue;
    }

    const [keyNode, paramsNode, langNode] = node.parent.arguments;
    const lang = isStringNode(langNode) ? langNode.text : '';
    let keys: string[] = [];
    const params: string[] =
      paramsNode && ts.isObjectLiteralExpression(paramsNode)
        ? resolveParams(paramsNode)
        : [];

    if (isStringNode(keyNode)) {
      keys = [keyNode.text];
    } else if (ts.isArrayLiteralExpression(keyNode)) {
      keys = keyNode.elements.filter(isStringNode).map((node) => node.text);
    }

    for (const key of keys) {
      result.push({ key, lang, params });
    }
  }

  return result;
}

function isStringNode(
  node: Node,
): node is StringLiteral | NoSubstitutionTemplateLiteral {
  return (
    node &&
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

  // Recursive function to handle nested properties
  function processProperty(property: ts.PropertyAssignment) {
    const key = property.name.getText().replace(/['"]/g, '');
    const initializer = property.initializer;

    if (!initializer) return;

    if (ts.isObjectLiteralExpression(initializer)) {
      // Handle nested object
      properties[key] = traverseParams(initializer);
    } else {
      // Simple value (string, number, etc.)
      properties[key] = initializer.getText();
    }
  }

  // Iterate through the properties of the ObjectLiteralExpression
  for (const property of params.properties) {
    if (ts.isPropertyAssignment(property)) {
      processProperty(property);
    }
  }

  // Convert the properties object to a JSON string
  return properties;
}
