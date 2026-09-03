import ts, { ImportDeclaration, Node, SourceFile } from 'typescript';

export function parseTsSource(content: string, fileName = ''): SourceFile {
  // `setParentNodes` must be on: extractors walk up from calls to their
  // declarations and `getText()` needs the parent chain.
  return ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

export function forEachDescendant(node: Node, visit: (node: Node) => void) {
  node.forEachChild(function walk(child) {
    visit(child);
    child.forEachChild(walk);
  });
}

export function hasDescendant(
  node: Node,
  predicate: (node: Node) => boolean,
): boolean {
  return !!findDescendant(node, predicate);
}

export function findDescendant(
  node: Node,
  predicate: (node: Node) => boolean,
): Node | undefined {
  // `forEachChild` stops as soon as the callback returns a truthy value.
  return node.forEachChild(function walk(child): Node | undefined {
    return predicate(child) ? child : child.forEachChild(walk);
  });
}

export function findDescendants(
  node: Node,
  predicate: (node: Node) => boolean,
): Node[] {
  const matches: Node[] = [];
  forEachDescendant(node, (child) => {
    if (predicate(child)) matches.push(child);
  });

  return matches;
}

// Source text of a name-like node without going through `getText()`.
export function nameText(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (
    ts.isIdentifier(node) ||
    ts.isPrivateIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.text;
  }

  return undefined;
}

export function isNamed(node: Node, name: string): boolean {
  return nameText(node) === name;
}

/**
 * Local name under which `importedName` is bound by the first import whose
 * module specifier matches, e.g. `t` for `import { marker as t } from '...'`.
 */
export function resolveImportedName(
  imports: ImportDeclaration[],
  moduleSpecifier: RegExp,
  importedName: string,
): string | undefined {
  for (const declaration of imports) {
    const specifier = declaration.moduleSpecifier;
    if (
      !ts.isStringLiteral(specifier) ||
      !moduleSpecifier.test(specifier.text)
    ) {
      continue;
    }

    const bindings = declaration.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;

    for (const element of bindings.elements) {
      const imported = element.propertyName ?? element.name;
      if (imported.text === importedName) {
        return element.name.text;
      }
    }
  }

  return undefined;
}
