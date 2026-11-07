import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { readFile } from '../utils/file.utils';

const BOM = '\uFEFF';

describe('readFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-keys-manager-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: string) {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  it(`GIVEN a JSON file prefixed with a UTF-8 BOM
      WHEN it is read with parse: true
      THEN it is parsed instead of throwing`, () => {
    const file = write('en.json', `${BOM}{"hello": "world"}`);

    expect(readFile(file, { parse: true })).toEqual({ hello: 'world' });
  });

  it(`GIVEN a plain JSON file without a BOM
      WHEN it is read with parse: true
      THEN it is parsed`, () => {
    const file = write('en.json', '{"hello": "world"}');

    expect(readFile(file, { parse: true })).toEqual({ hello: 'world' });
  });

  it(`GIVEN a malformed JSON file
      WHEN it is read with parse: true
      THEN it throws`, () => {
    const file = write('en.json', '{"hello": }');

    expect(() => readFile(file, { parse: true })).toThrow();
  });

  it(`GIVEN a file prefixed with a UTF-8 BOM
      WHEN it is read without parsing
      THEN the content is returned verbatim`, () => {
    // Raw reads feed prettier, which writes the result back to the user's file,
    // so the BOM is deliberately left alone outside the parse branch.
    const file = write('en.json', `${BOM}{"hello": "world"}`);

    expect(readFile(file)).toBe(`${BOM}{"hello": "world"}`);
  });
});
