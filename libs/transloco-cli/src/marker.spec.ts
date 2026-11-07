import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import ts from './keys-manager/utils/typescript';
import { marker } from './marker';

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

  it(`GIVEN the ./marker export of the package
      WHEN its types and default targets are mapped to the bundle entries
      THEN both point at the files the marker entry produces`, async () => {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(import.meta.dirname, '../package.json'),
        'utf-8',
      ),
    );
    const { types, default: entry } = pkg.exports['./marker'];
    const { default: config } = await import('../tsdown.config');
    const entries = (config as { entry: Record<string, string> }).entry;

    // The bundle emits the entry `<name>` as `<name>.js` and `<name>.d.ts`
    const name = entry.replace(/^\.\//, '').replace(/\.js$/, '');

    expect(types).toBe(`./${name}.d.ts`);
    expect(entries[name]).toBe('src/marker.ts');
  });

  it(`GIVEN a consumer resolving types with moduleResolution node10
      WHEN it imports the ./marker subpath
      THEN typesVersions maps it to the same declaration file as the exports map`, () => {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(import.meta.dirname, '../package.json'),
        'utf-8',
      ),
    );

    expect(pkg.typesVersions['*'].marker).toEqual([
      pkg.exports['./marker'].types.replace(/^\.\//, ''),
    ]);
  });
});
