import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import ts from './keys-manager/utils/typescript.js';
import { marker } from './marker.js';

describe('marker', () => {
  it(`GIVEN a key
      WHEN it is passed to marker
      THEN the same key comes back`, () => {
    expect(marker('some.key')).toBe('some.key');
    expect(marker(['a', 'b'])).toEqual(['a', 'b']);
    expect(marker('some.key', undefined, 'scope')).toBe('some.key');
  });

  it(`GIVEN the source of the marker module
      WHEN its statements are listed
      THEN it neither imports nor re-exports anything, as it is bundled into applications`, () => {
    const file = ts.createSourceFile(
      'marker.ts',
      fs.readFileSync(path.join(import.meta.dirname, 'marker.ts'), 'utf-8'),
      ts.ScriptTarget.Latest,
      true,
    );

    const moduleReferences: string[] = [];
    (function visit(node: import('typescript').Node) {
      const isCall =
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText() === 'require');
      if (
        ts.isImportDeclaration(node) ||
        ts.isImportEqualsDeclaration(node) ||
        ts.isImportTypeNode(node) ||
        (ts.isExportDeclaration(node) && node.moduleSpecifier) ||
        isCall
      ) {
        moduleReferences.push(node.getText());
      }
      node.forEachChild(visit);
    })(file);

    expect(moduleReferences).toEqual([]);
  });
});
