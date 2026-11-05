import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import validator from './transloco-validator';

const BOM = '\uFEFF';

describe('transloco-validator', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-validator-'));
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
      WHEN it is validated
      THEN it does not throw`, () => {
    const file = write('en.json', `${BOM}{"hello": "world"}`);

    expect(() => validator([file])).not.toThrow();
  });

  it(`GIVEN a BOM-prefixed JSON file with duplicate keys
      WHEN it is validated
      THEN it still reports the duplicate keys`, () => {
    const file = write('en.json', `${BOM}{"a": "1", "a": "2"}`);

    expect(() => validator([file])).toThrow(/duplicate keys/i);
  });

  it(`GIVEN a plain JSON file without a BOM
      WHEN it is validated
      THEN it does not throw`, () => {
    const file = write('en.json', '{"hello": "world"}');

    expect(() => validator([file])).not.toThrow();
  });

  it(`GIVEN a malformed JSON file
      WHEN it is validated
      THEN it throws`, () => {
    const file = write('en.json', '{"hello": }');

    expect(() => validator([file])).toThrow();
  });
});
