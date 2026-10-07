import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { optimizeFiles } from './transloco-optimize';

const BOM = '\uFEFF';

describe('optimizeFiles', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-optimize-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: string) {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf8');

    return filePath;
  }

  function read(filePath: string) {
    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }

  it(`GIVEN a translation file prefixed with a UTF-8 BOM
      WHEN it is optimized
      THEN it is flattened instead of rejecting`, async () => {
    const file = write('en.json', `${BOM}{"a": {"b": "c"}}`);

    await expect(optimizeFiles([file], 'comment')).resolves.toBeUndefined();
    expect(read(file)).toBe('{"a.b":"c"}');
  });

  it(`GIVEN a plain translation file without a BOM
      WHEN it is optimized
      THEN it is flattened and its comments are removed`, async () => {
    const file = write('en.json', '{"a": {"b": "c", "comment": "drop me"}}');

    await expect(optimizeFiles([file], 'comment')).resolves.toBeUndefined();
    expect(read(file)).toBe('{"a.b":"c"}');
  });

  it(`GIVEN a malformed translation file
      WHEN it is optimized
      THEN it rejects`, async () => {
    const file = write('en.json', '{"a": }');

    await expect(optimizeFiles([file], 'comment')).rejects.toThrow();
  });
});
