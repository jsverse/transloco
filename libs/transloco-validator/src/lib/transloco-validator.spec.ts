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

  it(`GIVEN a value with a missing curly brace
      WHEN it is validated
      THEN it throws naming the offending key`, () => {
    const file = write(
      'en.json',
      JSON.stringify({
        title: 'Created by { first }} {{ last }}',
      }),
    );

    expect(() => validator([file])).toThrow(/title/);
  });

  it(`GIVEN a nested value with an extra closing brace
      WHEN it is validated
      THEN it throws with the full key path`, () => {
    const file = write('en.json', JSON.stringify({ a: { b: 'hello }}' } }));

    expect(() => validator([file])).toThrow(/a\.b/);
  });

  it(`GIVEN a value inside an array with unbalanced braces
      WHEN it is validated
      THEN it throws`, () => {
    const file = write('en.json', JSON.stringify({ list: ['ok', '{{ x }'] }));

    expect(() => validator([file])).toThrow(/list\[1]/);
  });

  it(`GIVEN values with balanced interpolation and ICU braces
      WHEN it is validated
      THEN it does not throw`, () => {
    const file = write(
      'en.json',
      JSON.stringify({
        interpolation: '{{ first }} {{ last }}',
        icu: '{count, plural, one {# item} other {# items}}',
        plain: 'no braces here',
      }),
    );

    expect(() => validator([file])).not.toThrow();
  });
});
