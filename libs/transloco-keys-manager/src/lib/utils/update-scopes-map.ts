import { ScriptKind, tsquery } from '@phenomnomnominal/tsquery';
import ts, {
  ArrayLiteralExpression,
  Node,
  NodeArray,
  ObjectLiteralExpression,
  PropertyAssignment,
  StringLiteral,
} from 'typescript';

import { addScope, hasScope } from '../keys-builder/utils/scope.utils';
import { Scopes } from '../types';

import { readFile } from './file.utils';
import { toCamelCase } from './string.utils';
import { normalizedGlob } from './normalize-glob-path';

type Scope = string;
type Alias = string;

interface ScopeDef {
  scope?: Scope;
  alias?: Alias;
}

type ScopeResolver = (node: Node) => ScopeDef[];

const tokenProviderQuery = `ObjectLiteralExpression:has(PropertyAssignment > Identifier[name=TRANSLOCO_SCOPE]) > PropertyAssignment > Identifier[name=/useValue|useFactory/]`;

function buildFunctionProviderQuery(scopeProviderFunctions: string[] = []) {
  return ['provideTranslocoScope', ...scopeProviderFunctions]
    .map((name) => `CallExpression > Identifier[name=${name}]`)
    .join(', ');
}

function buildProviderRegex(scopeProviderFunctions: string[] = []) {
  const names = [
    'TRANSLOCO_SCOPE',
    'provideTranslocoScope',
    ...scopeProviderFunctions,
  ];
  return new RegExp(`(${names.join('|')})`);
}

function stringQueryDef(rootNode: Node) {
  return (
    tsquery(rootNode, `StringLiteral`)
      // Since we are querying for StringLiteral we might pickup nested nodes from
      // the scope def and cause duplications, we only want direct children from the root node
      .filter((node) => node.parent === rootNode)
      .map((node) => ({ scope: (node as StringLiteral).text }))
  );
}

function objectQueryDef(rootNode: Node) {
  return tsquery(
    rootNode,
    'ObjectLiteralExpression:has(Identifier[name=scope])',
  ).map((node) => {
    const result: ScopeDef = {};

    for (const prop of (node as ObjectLiteralExpression)
      .properties as NodeArray<PropertyAssignment>) {
      if (prop.initializer) {
        const key = prop.name.getText();
        if (key === 'scope' || key === 'alias') {
          result[key] = prop.initializer.getText().replace(/['"]/g, '');
        }
      }
    }

    return result;
  });
}

// Order is important, we check if it's an object first, then string
const scopeValueQueries: ScopeResolver[] = [objectQueryDef, stringQueryDef];

type Options = {
  input?: string[];
  files?: string[];
  scopeProviderFunctions?: string[];
};

export function updateScopesMap(
  options: Omit<Options, 'input'>,
): Scopes['aliasToScope'];
export function updateScopesMap(
  options: Omit<Options, 'files'>,
): Scopes['aliasToScope'];
export function updateScopesMap({
  input,
  files,
  scopeProviderFunctions,
}: Options): Scopes['aliasToScope'] {
  const tsFiles =
    files || input!.map((path) => normalizedGlob(`${path}/**/*.ts`)).flat();
  // Return only the new scopes (for the plugin)
  const aliasToScope: Record<Alias, Scope> = {};

  const translocoProvider = buildProviderRegex(scopeProviderFunctions);
  const functionProviderQuery = buildFunctionProviderQuery(
    scopeProviderFunctions,
  );

  for (const file of tsFiles) {
    const content = readFile(file);

    if (!translocoProvider.test(content)) continue;

    const result: ScopeDef[] = [];

    const ast = tsquery.ast(content, undefined, ScriptKind.TS);

    const tokenAndProviderNodes = tsquery(
      ast,
      `${tokenProviderQuery}, ${functionProviderQuery}`,
    );

    for (let node of tokenAndProviderNodes) {
      // :has(> child) is not supported ... So we need to use a workaround, select child and make second query for parent
      node = node.parent;

      if (ts.isCallExpression(node)) {
        const [providersArray] = tsquery(node, 'ArrayLiteralExpression');
        if (providersArray) {
          result.push(...resolveScopeProvider(providersArray));
          continue;
        }
      }

      result.push(...resolveScopeProvider(node));
    }

    for (const { scope, alias: rawAlias } of result) {
      if (scope && !hasScope(scope)) {
        const alias = rawAlias ?? toCamelCase(scope);
        addScope(scope, alias);
        aliasToScope[alias] = scope;
      }
    }
  }

  return aliasToScope;
}

function resolveScopeProvider(node: Node) {
  return scopeValueQueries.map((resolver) => resolver(node)).flat();
}
