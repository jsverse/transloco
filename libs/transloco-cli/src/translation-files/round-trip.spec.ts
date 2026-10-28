import { describe, expect, it } from 'vitest';

import { joinTranslations, type JoinOptions } from './join.js';
import { splitTranslations } from './split.js';
import {
  applyPlannedFiles,
  createMemoryReader,
  json,
  type MemoryFiles,
} from './tests/memory-file-reader.js';

const root = 'src/assets/i18n';

/** Joins the files with every language included. */
const joinAll = (
  files: MemoryFiles,
  scopePathMap?: JoinOptions['scopePathMap'],
) =>
  joinTranslations(createMemoryReader(files), {
    root,
    outDir: 'dist-i18n',
    defaultLang: 'en',
    includeDefaultLang: true,
    scopePathMap,
  });

/** Joins the files, splits what was joined, and joins the result once more. */
function roundTrip(
  files: MemoryFiles,
  scopePathMap?: JoinOptions['scopePathMap'],
) {
  const firstJoin = joinAll(files, scopePathMap);
  const joined = applyPlannedFiles(files, firstJoin);
  const result = applyPlannedFiles(
    joined,
    splitTranslations(createMemoryReader(joined), {
      root,
      source: 'dist-i18n',
      scopePathMap,
    }),
  );

  return { firstJoin, result, secondJoin: joinAll(result, scopePathMap) };
}

/** The en and es file of the folder, each holding its own value. */
const pair = (dir: string, en: unknown, es: unknown): MemoryFiles => ({
  [`${dir}/en.json`]: json(en),
  [`${dir}/es.json`]: json(es),
});

function expectInverse(
  files: MemoryFiles,
  scopePathMap?: JoinOptions['scopePathMap'],
) {
  const { firstJoin, result, secondJoin } = roundTrip(files, scopePathMap);

  for (const [file, content] of Object.entries(files)) {
    expect(result[file], file).toBe(content);
  }
  expect(secondJoin).toEqual(firstJoin);
}

describe('join then split', () => {
  it(`GIVEN root files and scope folders written as the commands write them
      WHEN they are joined and then split
      THEN every file holds its original bytes again`, () => {
    expectInverse({
      ...pair(
        root,
        { hello: 'hello', bye: 'bye' },
        { hello: 'hola', bye: 'adios' },
      ),
      ...pair(
        `${root}/admin`,
        { title: { main: 'Admin' } },
        { title: { main: 'Administrador' } },
      ),
      ...pair(`${root}/shop`, { cart: 'Cart' }, { cart: 'Carrito' }),
    });
  });

  it(`GIVEN a scope folder nested in another one
      WHEN they are joined and then split
      THEN every file holds its original bytes again and a second join gives the same files`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { a: 1 }, { a: 2 }),
      ...pair(`${root}/admin/users`, { b: { c: 3 } }, { b: { c: 4 } }),
    });
  });

  it(`GIVEN scope folders nested three levels deep
      WHEN they are joined and then split
      THEN every file holds its original bytes again and a second join gives the same files`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { a: 1 }, { a: 2 }),
      ...pair(`${root}/admin/users`, { b: 1 }, { b: 2 }),
      ...pair(`${root}/admin/users/roles`, { c: 1 }, { c: 2 }),
      ...pair(`${root}/shop`, { d: 1 }, { d: 2 }),
      ...pair(`${root}/shop/cart`, { e: 1 }, { e: 2 }),
    });
  });

  it(`GIVEN a scopePathMap with a nested folder
      WHEN they are joined and then split
      THEN every file holds its original bytes again and a second join gives the same files`, () => {
    expectInverse(
      {
        ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
        ...pair('libs/admin/i18n', { a: 1 }, { a: 2 }),
        ...pair('libs/admin/i18n/users', { b: 1 }, { b: 2 }),
        ...pair('libs/admin/i18n/users/roles', { c: 1 }, { c: 2 }),
      },
      { admin: 'libs/admin/i18n' },
    );
  });

  it(`GIVEN a nested folder inside a folder with no files of its own
      WHEN they are joined and then split
      THEN the nested files are given their translations back`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin/users`, { b: 1 }, { b: 2 }),
    });
  });

  it(`GIVEN a nested folder with a file for one language only
      WHEN they are joined and then split
      THEN every file holds its original bytes again`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { a: 1 }, { a: 2 }),
      [`${root}/admin/users/es.json`]: json({ b: 2 }),
    });
  });

  it(`GIVEN a scope with a key named like its nested folder
      WHEN they are joined and then split
      THEN the key stays in the scope and the folder gets its own file back`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { users: 'Users' }, { users: 'Usuarios' }),
      ...pair(`${root}/admin/users`, { b: 1 }, { b: 2 }),
    });
  });

  it(`GIVEN a scope with a key named like a nested folder that has no file for the language
      WHEN they are joined and then split
      THEN the key stays in the scope`, () => {
    expectInverse({
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { users: 'Users' }, { users: 'Usuarios' }),
      [`${root}/admin/users/en.json`]: json({ b: 1 }),
    });
  });

  it(`GIVEN a nested folder and edited joined files
      WHEN they are split
      THEN the edit is written to the nested folder`, () => {
    const files: MemoryFiles = {
      ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
      ...pair(`${root}/admin`, { a: 1 }, { a: 2 }),
      ...pair(`${root}/admin/users`, { b: 1 }, { b: 2 }),
    };
    const joined = applyPlannedFiles(files, joinAll(files));
    const edited = {
      ...joined,
      'dist-i18n/es.json': json({
        hello: 'hola',
        admin: { a: 2 },
        'admin.users': { b: 20 },
      }),
    };

    const result = applyPlannedFiles(
      edited,
      splitTranslations(createMemoryReader(edited), {
        root,
        source: 'dist-i18n',
      }),
    );

    expect(result[`${root}/admin/users/es.json`]).toBe(json({ b: 20 }));
    expect(result[`${root}/admin/es.json`]).toBe(json({ a: 2 }));
    expect(result[`${root}/es.json`]).toBe(json({ hello: 'hola' }));
  });
});
