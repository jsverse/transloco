import {
  AST,
  ASTWithSource,
  ParenthesizedExpression,
  TmplAstBoundAttribute,
  TmplAstNode,
  TmplAstTextAttribute,
} from '@angular/compiler';
import {
  isConditionalExpression,
  isLiteralExpression,
  isLiteralMap,
} from '@jsverse/angular-utils';

import { ExtractorConfig, OrArray } from '../../types';
import { addKey } from '../add-key';
import { resolveAliasAndKey } from '../utils/resolvers.utils';
import { coerceArray } from '../../utils/collection.utils';
import { isString, notNil } from '../../utils/validators.utils';

import { TemplateExtractorConfig } from './types';
import {
  isBlockNode,
  isBoundAttribute,
  isElement,
  isInterpolation,
  isSupportedNode,
  isTemplate,
  isTextAttribute,
  parseTemplate,
  resolveBlockChildNodes,
  resolveKeysFromLiteralMap,
} from './utils';

export function directiveExtractor(config: TemplateExtractorConfig) {
  const ast = parseTemplate(config);
  traverse(ast.nodes, config);
}

function traverse(nodes: TmplAstNode[], config: ExtractorConfig) {
  for (const node of nodes) {
    if (isBlockNode(node)) {
      traverse(resolveBlockChildNodes(node), config);
      continue;
    }

    if (!isSupportedNode(node, [isTemplate, isElement])) {
      continue;
    }

    const params = node.inputs
      .filter(isTranslocoParams)
      .map((ast) => {
        const value = ast.value;
        if (value instanceof ASTWithSource && isLiteralMap(value.ast)) {
          return resolveKeysFromLiteralMap(value.ast);
        }

        return [];
      })
      .flat();
    const keys = [...node.inputs, ...node.attributes]
      .filter(isTranslocoDirective)
      .map((ast) => {
        let value = ast.value;
        if (value instanceof ASTWithSource) {
          value = value.ast;
        }

        return isInterpolation(value) ? (value.expressions as AST[]) : value;
      })
      .flat()
      .map(resolveKey)
      .flat();
    addKeys(keys, params, config);
    traverse(node.children, config);
  }
}

function isTranslocoDirective(
  ast: unknown,
): ast is TmplAstBoundAttribute | TmplAstTextAttribute {
  return (
    (isBoundAttribute(ast) || isTextAttribute(ast)) && ast.name === 'transloco'
  );
}

function isTranslocoParams(ast: unknown): ast is TmplAstBoundAttribute {
  return isBoundAttribute(ast) && ast.name === 'translocoParams';
}

function resolveKey(ast: OrArray<AST | string>): string[] {
  return coerceArray(ast)
    .map((expression) => {
      if (typeof expression === 'string') {
        return expression;
      } else if (isConditionalExpression(expression)) {
        return resolveKey([expression.trueExp, expression.falseExp]);
      } else if (isLiteralExpression(expression)) {
        return expression.value;
      } else if (expression instanceof ParenthesizedExpression) {
        return resolveKey(expression.expression);
      }
    })
    .filter((key) => notNil(key) && (isString(key) || Array.isArray(key)))
    .flat();
}

function addKeys(
  keys: string[],
  params: string[],
  config: ExtractorConfig,
): void {
  for (const rawKey of keys) {
    const [key, scopeAlias] = resolveAliasAndKey(rawKey, config.scopes);
    addKey({
      ...config,
      keyWithoutScope: key,
      scopeAlias,
      params,
    });
  }
}
