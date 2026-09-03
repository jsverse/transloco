import ts, { Node, ObjectLiteralExpression } from 'typescript';

import { addScope, hasScope } from '../keys-builder/utils/scope.utils';
import { Scopes } from '../types';

import { readFile } from './file.utils';
import { toCamelCase } from './string.utils';
import { normalizedGlob } from './normalize-glob-path';
import {
  findDescendant,
  findDescendants,
  forEachDescendant,
  hasDescendant,
  isNamed,
  nameText,
  parseTsSource,
} from './ts-ast.utils';

type Scope = string;
type Alias = string;

interface ScopeDef {
  scope?: Scope;
  alias?: Alias;
}

type Options = { input?: string[]; files?: string[] };

const translocoProvider = /(TRANSLOCO_SCOPE|provideTranslocoScope)/;

export function updateScopesMap(
  options: Omit<Options, 'input'>,
): Scopes['aliasToScope'];
export function updateScopesMap(
  options: Omit<Options, 'files'>,
): Scopes['aliasToScope'];
export function updateScopesMap({
  input,
  files,
}: Options): Scopes['aliasToScope'] {
  const tsFiles =
    files || input!.map((path) => normalizedGlob(`${path}/**/*.ts`)).flat();
  // Return only the new scopes (for the plugin)
  const aliasToScope: Record<Alias, Scope> = {};

  for (const file of tsFiles) {
    const content = readFile(file);

    if (!translocoProvider.test(content)) continue;

    const result: ScopeDef[] = [];

    forEachDescendant(parseTsSource(content, file), (node) => {
      if (ts.isObjectLiteralExpression(node) && isScopeProvider(node)) {
        // `{ provide: TRANSLOCO_SCOPE, useValue: ... }`
        for (const prop of node.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            (isNamed(prop.name, 'useValue') || isNamed(prop.name, 'useFactory'))
          ) {
            result.push(...resolveScopeProvider(prop));
          }
        }
      } else if (
        ts.isCallExpression(node) &&
        isNamed(node.expression, 'provideTranslocoScope')
      ) {
        // `provideTranslocoScope('a')`, `provideTranslocoScope(['a', { scope: 'b' }])`
        const providersArray = findDescendant(
          node,
          ts.isArrayLiteralExpression,
        );
        result.push(...resolveScopeProvider(providersArray ?? node));
      }
    });

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

function isScopeProvider(node: ObjectLiteralExpression) {
  return node.properties.some(
    (prop) =>
      ts.isPropertyAssignment(prop) &&
      isNamed(prop.initializer, 'TRANSLOCO_SCOPE'),
  );
}

// Order is important, we check if it's an object first, then string
function resolveScopeProvider(node: Node): ScopeDef[] {
  return [...objectScopeDefs(node), ...stringScopeDefs(node)];
}

// `{ scope: 'todos', alias?: 'todosAlias' }` anywhere under the node
function objectScopeDefs(root: Node): ScopeDef[] {
  const isScopeKey = (node: Node) =>
    ts.isIdentifier(node) && node.text === 'scope';

  return findDescendants(
    root,
    (node): node is ObjectLiteralExpression =>
      ts.isObjectLiteralExpression(node) && hasDescendant(node, isScopeKey),
  ).map((node) => {
    const result: ScopeDef = {};

    for (const prop of (node as ObjectLiteralExpression).properties) {
      if (!ts.isPropertyAssignment(prop)) continue;

      const key = nameText(prop.name) ?? prop.name.getText();
      if (key === 'scope' || key === 'alias') {
        result[key] = prop.initializer.getText().replace(/['"]/g, '');
      }
    }

    return result;
  });
}

// Plain `'todos'` scopes that are direct children of the node, so nested
// string values inside object scope definitions are not picked up twice.
function stringScopeDefs(root: Node): ScopeDef[] {
  const defs: ScopeDef[] = [];
  root.forEachChild((child) => {
    if (ts.isStringLiteral(child)) defs.push({ scope: child.text });
  });

  return defs;
}
