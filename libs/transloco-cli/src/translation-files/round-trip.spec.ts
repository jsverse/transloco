import { describe, expect, it } from 'vitest';

import { joinTranslations } from './join.js';
import { splitTranslations } from './split.js';
import {
  applyPlannedFiles,
  createMemoryReader,
  json,
  type MemoryFiles,
} from './tests/memory-file-reader.js';

const root = 'src/assets/i18n';

/** Joins the files with every language included, then splits what was joined. */
function joinThenSplit(files: MemoryFiles) {
  const joined = applyPlannedFiles(
    files,
    joinTranslations(createMemoryReader(files), {
      root,
      outDir: 'dist-i18n',
      defaultLang: 'en',
      includeDefaultLang: true,
    }),
  );

  return applyPlannedFiles(
    joined,
    splitTranslations(createMemoryReader(joined), {
      root,
      source: 'dist-i18n',
    }),
  );
}

describe('join then split', () => {
  it(`GIVEN root files and scope folders written as the commands write them
      WHEN they are joined and then split
      THEN every file holds its original bytes again`, () => {
    const files: MemoryFiles = {
      [`${root}/en.json`]: json({ hello: 'hello', bye: 'bye' }),
      [`${root}/es.json`]: json({ hello: 'hola', bye: 'adios' }),
      [`${root}/admin/en.json`]: json({ title: { main: 'Admin' } }),
      [`${root}/admin/es.json`]: json({ title: { main: 'Administrador' } }),
      [`${root}/shop/en.json`]: json({ cart: 'Cart' }),
      [`${root}/shop/es.json`]: json({ cart: 'Carrito' }),
    };

    const result = joinThenSplit(files);

    for (const [file, content] of Object.entries(files)) {
      expect(result[file]).toBe(content);
    }
  });

  // Join keys a nested folder as one dotted key beside its parent, while split
  // looks for it inside the parent, so the nested folder is never given its
  // translations back and they end up in the root file instead. This pins what
  // the schematics have always done, it isn't a contract.
  it(`GIVEN a scope folder nested in another one
      WHEN they are joined and then split
      THEN the nested files are not rewritten and the root file keeps their keys`, () => {
    const files: MemoryFiles = {
      [`${root}/es.json`]: json({ hello: 'hola' }),
      [`${root}/scope/es.json`]: json({ a: 1 }),
      [`${root}/scope/nested/es.json`]: json({ b: 2 }),
    };

    const result = joinThenSplit(files);

    expect(result[`${root}/scope/es.json`]).toBe(
      files[`${root}/scope/es.json`],
    );
    expect(result[`${root}/scope/nested/es.json`]).toBe(
      files[`${root}/scope/nested/es.json`],
    );
    expect(result[`${root}/es.json`]).toBe(
      json({ hello: 'hola', 'scope.nested': { b: 2 } }),
    );
  });

  it(`GIVEN a scope folder nested in another one and edited joined files
      WHEN they are split
      THEN the edit of the nested folder is not written back to it`, () => {
    const files: MemoryFiles = {
      [`${root}/es.json`]: json({ hello: 'hola' }),
      [`${root}/scope/es.json`]: json({ a: 1 }),
      [`${root}/scope/nested/es.json`]: json({ b: 2 }),
      'dist-i18n/es.json': json({
        hello: 'hola',
        scope: { a: 1 },
        'scope.nested': { b: 3 },
      }),
    };

    const result = applyPlannedFiles(
      files,
      splitTranslations(createMemoryReader(files), {
        root,
        source: 'dist-i18n',
      }),
    );

    expect(result[`${root}/scope/nested/es.json`]).toBe(json({ b: 2 }));
  });
});
