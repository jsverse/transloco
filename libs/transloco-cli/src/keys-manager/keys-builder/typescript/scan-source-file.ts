import ts, {
  CallExpression,
  ImportDeclaration,
  Node,
  NoSubstitutionTemplateLiteral,
  SourceFile,
} from 'typescript';

import { hasDescendant, isNamed, nameText } from '../../utils/ts-ast.utils';

/**
 * Everything the TS extractors need, collected in a single walk of the AST so
 * no extractor has to traverse the file again.
 */
export interface SourceFileScan {
  imports: ImportDeclaration[];
  calls: CallExpression[];
  // Local names bound to a `TranslocoService` instance, e.g. `transloco` in
  // `constructor(private transloco: TranslocoService)` or
  // `transloco = inject(TranslocoService)`.
  serviceNames: Set<string>;
  // `template: \`...\`` literals of `@Component` decorators.
  inlineTemplates: NoSubstitutionTemplateLiteral[];
}

export function scanSourceFile(ast: SourceFile): SourceFileScan {
  const scan: SourceFileScan = {
    imports: [],
    calls: [],
    serviceNames: new Set(),
    inlineTemplates: [],
  };

  ast.forEachChild(function walk(node) {
    if (ts.isImportDeclaration(node)) {
      scan.imports.push(node);
    } else if (ts.isCallExpression(node)) {
      scan.calls.push(node);
      if (isInjectTranslocoService(node)) {
        const name = nameText(resolveInjectTarget(node)?.name);
        if (name) scan.serviceNames.add(name);
      }
    } else if (ts.isParameter(node) && isTranslocoServiceParam(node)) {
      const name = nameText(node.name);
      if (name) scan.serviceNames.add(name);
    } else if (ts.isDecorator(node)) {
      scan.inlineTemplates.push(...resolveInlineTemplates(node));
    }

    node.forEachChild(walk);
  });

  return scan;
}

// `constructor(private transloco: TranslocoService)`
function isTranslocoServiceParam(param: ts.ParameterDeclaration) {
  return (
    !!param.type &&
    ts.isConstructorDeclaration(param.parent) &&
    hasDescendant(
      param,
      (node) =>
        ts.isTypeReferenceNode(node) &&
        (isNamed(node.typeName, 'TranslocoService') ||
          hasDescendant(node, (n) => isNamed(n, 'TranslocoService'))),
    )
  );
}

// `inject(TranslocoService)`, with or without extra options
function isInjectTranslocoService(call: CallExpression) {
  return (
    isNamed(call.expression, 'inject') &&
    hasDescendant(call, (node) => isNamed(node, 'TranslocoService'))
  );
}

// The property or variable an `inject(...)` call initializes, if any.
function resolveInjectTarget(
  call: CallExpression,
): ts.PropertyDeclaration | ts.VariableDeclaration | undefined {
  let node: Node | undefined = call.parent;
  while (node && !ts.isSourceFile(node)) {
    if (ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) {
      return node;
    }
    node = node.parent;
  }

  return undefined;
}

// `@Component({ template: \`...\` })`; substitution templates are skipped as
// their content cannot be resolved statically.
function resolveInlineTemplates(
  decorator: ts.Decorator,
): NoSubstitutionTemplateLiteral[] {
  const call = decorator.expression;
  if (!ts.isCallExpression(call) || !isComponentDecorator(call)) return [];

  const templates: NoSubstitutionTemplateLiteral[] = [];
  for (const arg of call.arguments) {
    if (!ts.isObjectLiteralExpression(arg)) continue;
    for (const prop of arg.properties) {
      if (
        ts.isPropertyAssignment(prop) &&
        isNamed(prop.name, 'template') &&
        ts.isNoSubstitutionTemplateLiteral(prop.initializer)
      ) {
        templates.push(prop.initializer);
      }
    }
  }

  return templates;
}

function isComponentDecorator(call: CallExpression) {
  const callee = call.expression;

  return (
    isNamed(callee, 'Component') ||
    (ts.isPropertyAccessExpression(callee) && isNamed(callee.name, 'Component'))
  );
}
