import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CliError } from '../errors.js';

import { runValidate } from './validate.js';

describe('runValidate', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-validate-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: string) {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  function catchError(files: string[]) {
    try {
      runValidate(files);
    } catch (error) {
      return error as CliError;
    }

    throw new Error('Expected the validation to fail');
  }

  it(`GIVEN valid translation files, one of them with a BOM
      WHEN they are validated
      THEN nothing is thrown`, () => {
    const files = [
      write('en.json', '{"hello": "world"}'),
      write('es.json', '\uFEFF{"hello": "mundo"}'),
    ];

    expect(() => runValidate(files)).not.toThrow();
  });

  it(`GIVEN a file with duplicate keys
      WHEN it is validated
      THEN it fails with the validator's own message`, () => {
    const file = write('en.json', '{"a": "1", "b": "2", "a": "3"}');

    const error = catchError([file]);

    expect(error).toBeInstanceOf(CliError);
    expect(error.exitCode).toBe(1);
    expect(error.message).toBe(`Found duplicate keys: a (${file})`);
  });

  it(`GIVEN a file that is not valid JSON
      WHEN it is validated
      THEN it fails with the parser's message on one line, followed by the file`, () => {
    const file = write('en.json', '{\n  "hello": \n}');

    const error = catchError([file]);

    expect(error).toBeInstanceOf(CliError);
    expect(error.message).toMatch(/JSON/);
    expect(error.message.endsWith(` (${file})`)).toBe(true);
    expect(error.message).not.toContain('\n');
  });

  it(`GIVEN a file that does not exist
      WHEN it is validated
      THEN it fails with one clean line that names the file`, () => {
    const file = path.join(dir, 'missing.json');

    const error = catchError([file]);

    expect(error).toBeInstanceOf(CliError);
    expect(error.exitCode).toBe(1);
    expect(error.message).toBe(`The path does not exist (${file})`);
  });

  it(`GIVEN a path below a file
      WHEN it is validated
      THEN it fails as a path that does not exist`, () => {
    const file = path.join(write('en.json', '{}'), 'nested.json');

    const error = catchError([file]);

    expect(error.message).toBe(`The path does not exist (${file})`);
  });

  it(`GIVEN an invalid file whose name also occurs in the error
      WHEN it is validated from its own directory
      THEN the file is still named after the message`, () => {
    const originalCwd = process.cwd();
    // The parser's message ends with "is not valid JSON"
    write('JSON', '{"a": }');
    process.chdir(dir);

    try {
      const error = catchError(['JSON']);

      expect(error.message).toMatch(/JSON/);
      expect(error.message.endsWith(' (JSON)')).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it(`GIVEN a directory instead of a file
      WHEN it is validated
      THEN it fails with one clean line that names the directory`, () => {
    const error = catchError([dir]);

    expect(error.message).toBe(`The path is a folder, not a file (${dir})`);
  });

  it(`GIVEN a missing path, a folder and an invalid file among valid ones
      WHEN they are validated
      THEN every problem is reported on its own line and the other files are still checked`, () => {
    const missing = path.join(dir, 'missing.json');
    const valid = write('en.json', '{"a": "1"}');
    const malformed = write('it.json', '{"a": }');

    const lines = catchError([missing, valid, dir, malformed]).message.split(
      '\n',
    );

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(`The path does not exist (${missing})`);
    expect(lines[1]).toBe(`The path is a folder, not a file (${dir})`);
    expect(lines[2].endsWith(` (${malformed})`)).toBe(true);
  });

  it(`GIVEN several files where more than one is invalid
      WHEN they are validated
      THEN every problem is reported on its own line, in the order of the files`, () => {
    const duplicated = write('en.json', '{"a": "1", "a": "2"}');
    const valid = write('es.json', '{"a": "1"}');
    const malformed = write('it.json', '{"a": }');

    const lines = catchError([duplicated, valid, malformed]).message.split(
      '\n',
    );

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(`Found duplicate keys: a (${duplicated})`);
    expect(lines[1].endsWith(` (${malformed})`)).toBe(true);
  });
});
