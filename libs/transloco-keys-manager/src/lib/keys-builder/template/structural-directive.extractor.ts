import {
  AST,
  ASTWithSource,
  Interpolation,
  Call,
  RecursiveAstVisitor,
  TmplAstBoundAttribute,
  TmplAstNode,
  TmplAstTemplate,
  TmplAstTextAttribute,
  PropertyRead,
} from '@angular/compiler';
import {
  isConditionalExpression,
  isLiteralExpression,
  isLiteralMap,
} from '@jsverse/angular-utils';

import { ExtractorConfig } from '../../types';
import { addKey } from '../add-key';
import { resolveAliasAndKey } from '../utils/resolvers.utils';
import { isString } from '../../utils/validators.utils';

import { TemplateExtractorConfig } from './types';
import {
  isBoundAttribute,
  isBoundText,
  isElement,
  isInterpolation,
  isCall,
  isNgTemplateTag,
  isSupportedNode,
  isTemplate,
  parseTemplate,
  isBlockNode,
  resolveBlockChildNodes,
  resolveKeysFromLiteralMap,
} from './utils';

interface MethodCallMetadata {
  keyNode?: AST;
  params: string[];
  read?: string;
}

interface ContainerMetaData {
  name: string;
  read?: string;
  /* We need to keep the element's span since we might have several method declarations with the same name */
  spanOffset: { start: number; end: number };
}

export function structuralDirectiveExtractor(config: TemplateExtractorConfig) {
  const ast = parseTemplate(config);
  traverse(ast.nodes, [], config);
}

export function traverse(
  nodes: TmplAstNode[],
  containers: ContainerMetaData[],
  config: TemplateExtractorConfig,
) {
  for (const node of nodes) {
    if (isBlockNode(node)) {
      traverse(resolveBlockChildNodes(node), containers, config);
      continue;
    }

    let methodUsages: MethodCallMetadata[] = [];

    if (isBoundText(node)) {
      const { expressions } = (node.value as ASTWithSource)
        .ast as Interpolation;
      methodUsages = getMethodUsages(expressions, containers);
    } else if (isSupportedNode(node, [isTemplate, isElement])) {
      if (isTranslocoTemplate(node)) {
        for (const metadata of resolveMetadata(node)) {
          containers.push(metadata);
        }
      }

      let attrsSource = node.inputs;
      if (isTemplate(node)) {
        attrsSource = node.inputs.concat(
          node.templateAttrs.filter(isBoundAttribute),
        );
      }

      const boundAttrs = attrsSource
        .map((input) => {
          const { ast } = input.value as ASTWithSource;

          return isInterpolation(ast) ? ast.expressions : ast;
        })
        .flat();

      methodUsages = getMethodUsages(boundAttrs, containers);
      traverse(node.children, containers, config);
    }

    addKeysFromAst(methodUsages, config);
  }
}

class MethodCallUnwrapper extends RecursiveAstVisitor {
  expressions: Call[] = [];

  override visitCall(method: Call, context: any) {
    this.expressions.push(method);
    super.visitCall(method, context);
  }
}

/**
 * Extract method calls from an AST.
 */
function unwrapMethodCalls(exp: AST): Call[] {
  const unwrapper = new MethodCallUnwrapper();
  unwrapper.visit(exp);
  return unwrapper.expressions;
}

function getMethodUsages(expressions: AST[], containers: ContainerMetaData[]) {
  const containerNames = new Set(containers.map((c) => c.name));

  return expressions
    .flatMap(unwrapMethodCalls)
    .filter((exp) => isTranslocoMethod(exp, containerNames))
    .map((exp) => {
      const [keyNode, paramsNode] = exp.args;

      return {
        keyNode,
        params: isLiteralMap(paramsNode)
          ? resolveKeysFromLiteralMap(paramsNode)
          : [],
        ...containers.find(({ name, spanOffset: { start, end } }) => {
          const inRange =
            exp.sourceSpan.end < end && exp.sourceSpan.start > start;

          return (exp.receiver as PropertyRead).name === name && inRange;
        })!,
      };
    });
}

function isTranslocoAttr(attr: TmplAstTextAttribute | TmplAstBoundAttribute) {
  return attr.name === 'transloco';
}

function isPrefixAttr<T extends { name: string }>(attr: T) {
  return attr.name === 'translocoPrefix' || attr.name === 'translocoRead';
}

function isTranslocoTemplate(node: TmplAstNode): node is TmplAstTemplate {
  return (
    isTemplate(node) &&
    (node.templateAttrs.some(isTranslocoAttr) ||
      (isNgTemplateTag(node) && node.attributes.some(isTranslocoAttr)))
  );
}

function isTranslocoMethod(exp: AST, containers: Set<string>): exp is Call {
  return isCall(exp) && containers.has((exp.receiver as PropertyRead).name);
}

function resolveMetadata(node: TmplAstTemplate): ContainerMetaData[] {
  /*
   * An ngTemplate element might have more than once implicit variables, we need to capture all of them.
   * */
  let metadata: Omit<ContainerMetaData, 'spanOffset'>[];
  if (isNgTemplateTag(node)) {
    const implicitVars = node.variables.filter((attr) => !attr.value);
    let read = node.attributes.find(isPrefixAttr)?.value;
    if (!read) {
      const ast = (node.inputs.find(isPrefixAttr)?.value as ASTWithSource)?.ast;
      if (isLiteralExpression(ast) && isString(ast.value)) {
        read = ast.value;
      }
    }

    metadata = implicitVars.map(({ name }) => ({ name, read }));
  } else {
    const implicitVar = node.variables.find(
      (variable) => variable.value === '$implicit',
    );
    if (!implicitVar) {
      return [];
    }

    const { name } = implicitVar;
    const read = node.templateAttrs.find(isPrefixAttr)?.value as ASTWithSource;
    metadata =
      isLiteralExpression(read?.ast) && isString(read?.ast.value)
        ? [{ name, read: read.ast.value }]
        : [{ name }];
  }

  return metadata.map((metadata) => {
    const sourceSpan = node.sourceSpan;

    return {
      ...metadata,
      spanOffset: {
        start: sourceSpan.start.offset,
        end: sourceSpan.end.offset,
      },
    };
  });
}

function addKeysFromAst(
  expressions: MethodCallMetadata[],
  config: ExtractorConfig,
) {
  for (const { keyNode, read, params } of expressions) {
    if (isConditionalExpression(keyNode)) {
      addKeysFromAst(
        [keyNode.trueExp, keyNode.falseExp].map((kn) => {
          return {
            keyNode: kn,
            read,
            params,
          };
        }),
        config,
      );
    } else if (isLiteralExpression(keyNode) && keyNode.value) {
      const value = read ? `${read}.${keyNode.value}` : keyNode.value;
      const [key, scopeAlias] = resolveAliasAndKey(value, config.scopes);
      addKey({
        ...config,
        params,
        keyWithoutScope: key,
        scopeAlias,
      });
    }
  }
}
