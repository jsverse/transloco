import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findFiles } from './find-files.js';

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

  it(`GIVEN a folder that does not exist
      WHEN files are looked for
      THEN there are none`, () => {
    expect(findFiles(path.join(dir, 'missing'), '.html')).toEqual([]);
  });
});
