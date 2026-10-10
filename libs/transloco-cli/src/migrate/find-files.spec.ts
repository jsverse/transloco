import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { globSync } from 'glob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findFiles } from './find-files.js';

vi.mock('glob', async (importOriginal) => {
  const original = await importOriginal<typeof import('glob')>();

  return { ...original, globSync: vi.fn(original.globSync) };
});

describe('findFiles', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-find-files-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '');
  }

  /** Where the system allows symlinks: the link at `link` to `target`, which is relative to the link. */
  function symlink(target: string, link: string) {
    try {
      fs.symlinkSync(target, path.join(dir, link));

      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        return false;
      }

      throw error;
    }
  }

  const abs = (...files: string[]) => files.map((file) => path.join(dir, file));

  it(`GIVEN files at several depths
      WHEN the ones ending with a suffix are looked for
      THEN they are all found, as absolute paths`, () => {
    write('a.html');
    write('x/b.html');
    write('x/y/z/c.html');
    write('x/d.ts');

    expect(findFiles(dir, '.html').sort()).toEqual([
      path.join(dir, 'a.html'),
      path.join(dir, 'x/b.html'),
      path.join(dir, 'x/y/z/c.html'),
    ]);
  });

  it(`GIVEN a suffix that is more than an extension
      WHEN files are looked for
      THEN the names ending with it are found, the file named by it alone included`, () => {
    write('a.spec.ts');
    write('b.ts');
    write('spec.ts');
    write('myspec.ts');

    expect(findFiles(dir, 'spec.ts').sort()).toEqual(
      ['a.spec.ts', 'myspec.ts', 'spec.ts'].map((name) => path.join(dir, name)),
    );
  });

  it(`GIVEN a folder named like a file
      WHEN files are looked for
      THEN only files are found`, () => {
    write('weird.html/inner.txt');
    write('real.html');

    expect(findFiles(dir, '.html')).toEqual([path.join(dir, 'real.html')]);
  });

  it(`GIVEN hidden files and folders
      WHEN files are looked for
      THEN they are left out, as a glob leaves them`, () => {
    write('.hidden.html');
    write('.cache/a.html');
    write('seen.html');

    expect(findFiles(dir, '.html')).toEqual([path.join(dir, 'seen.html')]);
  });

  it(`GIVEN a folder whose name is made of glob syntax
      WHEN files are looked for in it
      THEN its files are found`, () => {
    write('[a]{b,c}(d)*?/e.html');

    expect(findFiles(path.join(dir, '[a]{b,c}(d)*?'), '.html')).toEqual([
      path.join(dir, '[a]{b,c}(d)*?/e.html'),
    ]);
  });

  it.each(['{b,c}', '{1..3}', 'a{b}c', '!(d)', '@(d)', '+(d)'])(
    `GIVEN an input folder named %s
     WHEN files are looked for in it
     THEN its files are found, the ones of the folders the name could expand to are not`,
    (name) => {
      write(`${name}/e.html`);
      ['b', 'c', '1', 'abc', 'd'].forEach((other) => write(`${other}/e.html`));

      expect(findFiles(path.join(dir, name), '.html')).toEqual(
        abs(`${name}/e.html`),
      );
    },
  );

  it(`GIVEN a folder that does not exist
      WHEN files are looked for
      THEN there are none`, () => {
    expect(findFiles(path.join(dir, 'missing'), '.html')).toEqual([]);
  });

  describe.each(['.html', '.ts'])('the suffix %s', (suffix) => {
    const file = (name: string) => `${name}${suffix}`;

    it(`GIVEN an input folder that is a symlink
        WHEN files are looked for in it
        THEN the files behind the link are found, below the path of the link`, (ctx) => {
      write(file('src/app/a'));
      if (!symlink('src/app', 'link')) {
        return ctx.skip();
      }

      expect(findFiles(path.join(dir, 'link'), suffix)).toEqual(
        abs(file('link/a')),
      );
    });

    it(`GIVEN a symlinked folder below the input folder
        WHEN files are looked for in it
        THEN the files behind the link are found`, (ctx) => {
      write(file('src/shared/s'));
      write(file('src/app/a'));
      if (!symlink('../shared', 'src/app/linked')) {
        return ctx.skip();
      }

      expect(findFiles(path.join(dir, 'src/app'), suffix)).toEqual(
        abs(file('src/app/a'), file('src/app/linked/s')),
      );
    });

    it(`GIVEN a symlinked file below the input folder
        WHEN files are looked for in it
        THEN the file is found`, (ctx) => {
      write(file('src/shared/s'));
      write(file('src/app/a'));
      if (!symlink(`../shared/${file('s')}`, file('src/app/linked'))) {
        return ctx.skip();
      }

      expect(findFiles(path.join(dir, 'src/app'), suffix)).toEqual(
        abs(file('src/app/a'), file('src/app/linked')),
      );
    });

    it(`GIVEN an input folder whose name has parentheses and brackets
        WHEN files are looked for in it
        THEN its files are found, and a folder of a name it would match as a pattern is left out`, () => {
      write(file('src/app (2) [old]/a'));
      write(file('src/app (2) o/b'));

      expect(findFiles(path.join(dir, 'src/app (2) [old]'), suffix)).toEqual(
        abs(file('src/app (2) [old]/a')),
      );
    });

    it(`GIVEN an input folder that is a symlink to a folder whose name has parentheses
        WHEN files are looked for in it
        THEN the files behind the link are found`, (ctx) => {
      write(file('src/app (2) [old]/a'));
      if (!symlink('src/app (2) [old]', 'link')) {
        return ctx.skip();
      }

      expect(findFiles(path.join(dir, 'link'), suffix)).toEqual(
        abs(file('link/a')),
      );
    });

    it(`GIVEN nested folders and a folder named like a file
        WHEN files are looked for
        THEN the files at every depth are found, and the folder is not`, () => {
      write(file('a'));
      write(file('x/y/z/b'));
      write(`x.html/inner${suffix === '.html' ? '.txt' : '.md'}`);
      fs.mkdirSync(path.join(dir, file('named')));

      expect(findFiles(dir, suffix)).toEqual(abs(file('a'), file('x/y/z/b')));
    });
  });

  describe('the order', () => {
    it(`GIVEN files whose names differ in case, digits and separators
        WHEN files are looked for
        THEN they come in code point order, as the path is written with "/"`, () => {
      ['b', 'Z', 'a-b', 'a/b', 'a0b', '10', '9', 'é'].forEach((name) =>
        write(`${name}.html`),
      );

      expect(findFiles(dir, '.html')).toEqual(
        abs(
          '10.html',
          '9.html',
          'Z.html',
          'a-b.html',
          'a/b.html',
          'a0b.html',
          'b.html',
          'é.html',
        ),
      );
    });

    it.each([
      ['as the glob listed them', (files: string[]) => files],
      ['reversed', (files: string[]) => [...files].reverse()],
      [
        'shuffled',
        (files: string[]) => [files[2], files[0], files[3], files[1]],
      ],
    ])(
      `GIVEN a glob that lists the files %s
       WHEN files are looked for
       THEN they come in path order`,
      (_, reorder) => {
        ['d', 'b', 'c', 'a'].forEach((name) => write(`${name}.html`));
        const listed = vi.mocked(globSync).getMockImplementation() as (
          ...args: unknown[]
        ) => string[];

        vi.mocked(globSync).mockImplementationOnce(((...args: unknown[]) =>
          reorder(listed(...args))) as typeof globSync);

        expect(findFiles(dir, '.html')).toEqual(
          abs('a.html', 'b.html', 'c.html', 'd.html'),
        );
      },
    );
  });
});
