import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { nodeFileReader } from './node-file-reader.js';

describe('nodeFileReader', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'node-file-reader-'));
  });

  afterEach(() => {
    fs.chmodSync(root, 0o755);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it(`GIVEN a folder with files and scopes
      WHEN they are listed
      THEN the names come back sorted`, () => {
    fs.writeFileSync(path.join(root, 'es.json'), '{}');
    fs.writeFileSync(path.join(root, 'en.json'), '{}');
    fs.mkdirSync(path.join(root, 'b'));
    fs.mkdirSync(path.join(root, 'a'));

    expect(nodeFileReader.listFiles(root)).toEqual(['en.json', 'es.json']);
    expect(nodeFileReader.listDirs(root)).toEqual(['a', 'b']);
  });

  it(`GIVEN a folder that doesn't exist
      WHEN it is listed
      THEN nothing is found`, () => {
    const missing = path.join(root, 'missing');

    expect(nodeFileReader.listFiles(missing)).toEqual([]);
    expect(nodeFileReader.listDirs(missing)).toEqual([]);
  });

  it(`GIVEN links that lead nowhere or in circles
      WHEN the folder is listed
      THEN they are left out`, () => {
    fs.writeFileSync(path.join(root, 'en.json'), '{}');
    fs.symlinkSync(path.join(root, 'gone'), path.join(root, 'dangling.json'));
    fs.symlinkSync(path.join(root, 'loop-b'), path.join(root, 'loop-a'));
    fs.symlinkSync(path.join(root, 'loop-a'), path.join(root, 'loop-b'));

    expect(nodeFileReader.listFiles(root)).toEqual(['en.json']);
    expect(nodeFileReader.listDirs(root)).toEqual([]);
  });

  // Root ignores the permission bits and Windows has none
  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    `GIVEN a folder that is listable but not searchable
      WHEN it is listed
      THEN the error is raised and nothing is silently left out`,
    () => {
      fs.writeFileSync(path.join(root, 'es.json'), '{}');
      fs.mkdirSync(path.join(root, 'admin'));
      fs.chmodSync(root, 0o444);

      expect(() => nodeFileReader.listFiles(root)).toThrow(/EACCES/);
      expect(() => nodeFileReader.listDirs(root)).toThrow(/EACCES/);
    },
  );
});
