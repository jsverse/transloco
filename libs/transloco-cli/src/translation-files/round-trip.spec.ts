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

describe('join then split of files formatted in their own way', () => {
  const plain: MemoryFiles = {
    ...pair(root, { hello: 'hello' }, { hello: 'hola' }),
    ...pair(`${root}/admin`, { title: 'Admin' }, { title: 'Administrador' }),
    ...pair(`${root}/shop`, { cart: 'Cart' }, { cart: 'Carrito' }),
  };

  const reformat = (files: MemoryFiles, format: (content: string) => string) =>
    Object.fromEntries(
      Object.entries(files).map(([file, content]) => [file, format(content)]),
    );

  const withFinalNewline = (content: string) => `${content}\n`;
  const minified = (content: string) => JSON.stringify(JSON.parse(content));
  const crlf = (content: string) => `${content.replaceAll('\n', '\r\n')}\r\n`;

  /** Joins the files, lets the edit change the joined ones, and splits them. */
  function splitAfter(
    files: MemoryFiles,
    edit: (joined: MemoryFiles) => MemoryFiles = (joined) => joined,
  ) {
    const joined = edit(applyPlannedFiles(files, joinAll(files)));

    return splitTranslations(createMemoryReader({ ...files, ...joined }), {
      root,
      source: 'dist-i18n',
    });
  }

  const editAdminTitle = (joined: MemoryFiles): MemoryFiles => ({
    ...joined,
    'dist-i18n/es.json': json({
      hello: 'hola',
      admin: { title: 'Administracion' },
      shop: { cart: 'Carrito' },
    }),
  });

  it.each([
    ['ends with a line break', withFinalNewline],
    ['is minified', minified],
    ['has Windows line endings', crlf],
  ])(
    `GIVEN translation files whose format %s
      WHEN they are joined and then split
      THEN no file is written, so every file holds its original bytes`,
    (_, format) => {
      expect(splitAfter(reformat(plain, format))).toEqual([]);
    },
  );

  it(`GIVEN translation files that end with a line break
      WHEN one value is edited in the joined file and it is split
      THEN only the file of that value is written, and it ends with a line break`, () => {
    const planned = splitAfter(
      reformat(plain, withFinalNewline),
      editAdminTitle,
    );

    expect(planned).toEqual([
      {
        path: `${root}/admin/es.json`,
        content: `${json({ title: 'Administracion' })}\n`,
      },
    ]);
  });

  it(`GIVEN translation files that do not end with a line break
      WHEN one value is edited in the joined file and it is split
      THEN only the file of that value is written, and it does not end with a line break`, () => {
    const planned = splitAfter(plain, editAdminTitle);

    expect(planned).toEqual([
      {
        path: `${root}/admin/es.json`,
        content: json({ title: 'Administracion' }),
      },
    ]);
  });

  it(`GIVEN a minified file
      WHEN one value is edited in the joined file and it is split
      THEN the file is written with two spaces of indentation`, () => {
    const planned = splitAfter(reformat(plain, minified), editAdminTitle);

    expect(planned).toEqual([
      {
        path: `${root}/admin/es.json`,
        content: json({ title: 'Administracion' }),
      },
    ]);
  });

  it(`GIVEN files with Windows line endings
      WHEN one value is edited in the joined file and it is split
      THEN only that file is written, with line feeds, as join writes it`, () => {
    const planned = splitAfter(reformat(plain, crlf), editAdminTitle);

    expect(planned).toEqual([
      {
        path: `${root}/admin/es.json`,
        content: `${json({ title: 'Administracion' })}\n`,
      },
    ]);
  });

  it(`GIVEN a root file whose value is edited in the joined file
      WHEN it is split
      THEN only the root file of that language is written`, () => {
    const planned = splitAfter(plain, (joined) => ({
      ...joined,
      'dist-i18n/es.json': json({
        hello: 'hola!',
        admin: { title: 'Administrador' },
        shop: { cart: 'Carrito' },
      }),
    }));

    expect(planned.map(({ path }) => path)).toEqual([`${root}/es.json`]);
  });
});
