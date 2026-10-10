import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  makeDir,
  outputFile,
  readJsonFile,
  writeJsonFile,
} from './file-system.js';

describe('file system helpers', () => {
  const platform = process.platform;
  let dir: string;

  function setPlatform(value: NodeJS.Platform) {
    Object.defineProperty(process, 'platform', { value, configurable: true });
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-fs-'));
  });

  afterEach(() => {
    setPlatform(platform);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function catchError(run: () => unknown): any {
    try {
      run();
    } catch (error) {
      return error;
    }

    throw new Error('Expected the call to throw');
  }

  describe('makeDir', () => {
    it(`GIVEN a path several levels below an existing directory
        WHEN it is created
        THEN every missing directory on the way is created`, () => {
      makeDir(path.join(dir, 'a', 'b', 'c'));

      expect(fs.statSync(path.join(dir, 'a', 'b', 'c')).isDirectory()).toBe(
        true,
      );
    });

    it(`GIVEN a directory that already holds a file
        WHEN it is created again
        THEN nothing is thrown and its content is untouched`, () => {
      fs.writeFileSync(path.join(dir, 'kept.json'), '{}');

      makeDir(dir);

      expect(fs.readdirSync(dir)).toEqual(['kept.json']);
    });

    it(`GIVEN a file where the directory should be
        WHEN the directory is created
        THEN it fails with EEXIST and the file is left alone`, () => {
      const file = path.join(dir, 'en.json');
      fs.writeFileSync(file, '{}');

      expect(catchError(() => makeDir(file)).code).toBe('EEXIST');
      expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    });

    it(`GIVEN a name holding a character Windows doesn't allow
        WHEN the directory is created on Windows
        THEN it fails with EINVAL naming the path, before anything is created`, () => {
      setPlatform('win32');
      const target = path.join(dir, 'what?', 'i18n');

      const error = catchError(() => makeDir(target));

      expect(error.code).toBe('EINVAL');
      expect(error.message).toBe(`Path contains invalid characters: ${target}`);
      expect(fs.readdirSync(dir)).toEqual([]);
    });

    // Only where the file system takes such a name
    it.skipIf(platform === 'win32')(
      `GIVEN the same name
        WHEN the directory is created on another platform
        THEN it is created`,
      () => {
        setPlatform('linux');
        const target = path.join(dir, 'what?', 'i18n');

        makeDir(target);

        expect(fs.statSync(target).isDirectory()).toBe(true);
      },
    );
  });

  describe('outputFile', () => {
    it(`GIVEN a file in a directory that doesn't exist
        WHEN it is written
        THEN the directories are created and the file holds exactly the given text`, () => {
      const file = path.join(dir, 'i18n', 'admin', 'en.json');

      outputFile(file, '{\n  "a": "b"\n}');

      expect(fs.readFileSync(file)).toEqual(Buffer.from('{\n  "a": "b"\n}'));
    });

    it(`GIVEN an existing file
        WHEN it is written
        THEN its content is replaced, a shorter text leaving nothing of the old one`, () => {
      const file = path.join(dir, 'en.json');
      fs.writeFileSync(file, '{"a": "a much longer content"}');

      outputFile(file, '{}');

      expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    });

    it(`GIVEN an empty text
        WHEN it is written
        THEN the file is created empty`, () => {
      const file = path.join(dir, 'en.pot');

      outputFile(file, '');

      expect(fs.statSync(file).size).toBe(0);
    });

    it(`GIVEN text with characters beyond ASCII
        WHEN it is written
        THEN it is stored as UTF-8 without a BOM`, () => {
      const file = path.join(dir, 'he.json');

      outputFile(file, '{"שלום": "🗝"}');

      expect(fs.readFileSync(file)).toEqual(
        Buffer.from('{"שלום": "🗝"}', 'utf8'),
      );
    });

    it(`GIVEN a file where the directory of the target should be
        WHEN the target is written
        THEN it fails with ENOTDIR and the file in the way is left alone`, () => {
      const inTheWay = path.join(dir, 'i18n');
      fs.writeFileSync(inTheWay, 'not a directory');

      expect(
        catchError(() => outputFile(path.join(inTheWay, 'en.json'), '{}')).code,
      ).toBe('ENOTDIR');
      expect(fs.readFileSync(inTheWay, 'utf8')).toBe('not a directory');
    });

    it(`GIVEN a directory where the file should be
        WHEN it is written
        THEN it fails with EISDIR`, () => {
      expect(catchError(() => outputFile(dir, '{}')).code).toBe('EISDIR');
    });
  });

  describe('readJsonFile', () => {
    function write(name: string, content: string | Buffer) {
      const file = path.join(dir, name);
      fs.writeFileSync(file, content);

      return file;
    }

    it(`GIVEN a JSON file
        WHEN it is read
        THEN its value is returned`, () => {
      const file = write('en.json', '{"a": {"b": "c"}, "list": [1, 2]}\n');

      expect(readJsonFile(file)).toEqual({ a: { b: 'c' }, list: [1, 2] });
    });

    it(`GIVEN a JSON file starting with a BOM
        WHEN it is read
        THEN the BOM is ignored`, () => {
      const file = write('en.json', '\uFEFF{"a": "b"}');

      expect(readJsonFile(file)).toEqual({ a: 'b' });
      expect(readJsonFile(file, { throws: false })).toEqual({ a: 'b' });
    });

    it(`GIVEN a JSON file with Windows line endings
        WHEN it is read
        THEN its value is returned`, () => {
      const file = write('en.json', '{\r\n  "a": "b"\r\n}\r\n');

      expect(readJsonFile(file)).toEqual({ a: 'b' });
    });

    it.each([
      ['0', 0],
      ['false', false],
      ['null', null],
      ['""', ''],
    ])(
      `GIVEN a file holding the JSON value %s
       WHEN it is read
       THEN that value is returned as it is`,
      (content, expected) => {
        const file = write('value.json', content);

        expect(readJsonFile(file)).toBe(expected);
        expect(readJsonFile(file, { throws: false })).toBe(expected);
      },
    );

    it(`GIVEN a file that isn't valid JSON
        WHEN it is read
        THEN the syntax error is thrown with the path in front of its message`, () => {
      const file = write('broken.json', '{"a": ');
      let parserMessage = '';
      try {
        JSON.parse('{"a": ');
      } catch (error: any) {
        parserMessage = error.message;
      }

      const error = catchError(() => readJsonFile(file));

      expect(error).toBeInstanceOf(SyntaxError);
      expect(error.message).toBe(`${file}: ${parserMessage}`);
      expect(String(error)).toBe(`SyntaxError: ${file}: ${parserMessage}`);
    });

    it(`GIVEN an empty file
        WHEN it is read
        THEN it fails like any other invalid JSON`, () => {
      const file = write('empty.json', '');

      const error = catchError(() => readJsonFile(file));

      expect(error).toBeInstanceOf(SyntaxError);
      expect(error.message.startsWith(`${file}: `)).toBe(true);
    });

    it(`GIVEN a path with no file
        WHEN it is read
        THEN the ENOENT error is thrown with the path in front of its message`, () => {
      const file = path.join(dir, 'missing.json');

      const error = catchError(() => readJsonFile(file));

      expect(error.code).toBe('ENOENT');
      expect(error.message).toBe(
        `${file}: ENOENT: no such file or directory, open '${file}'`,
      );
    });

    it(`GIVEN a directory
        WHEN it is read
        THEN the EISDIR error is thrown with the path in front of its message`, () => {
      const error = catchError(() => readJsonFile(dir));

      expect(error.code).toBe('EISDIR');
      expect(error.message.startsWith(`${dir}: EISDIR: `)).toBe(true);
    });

    it(`GIVEN files that can't be read or parsed
        WHEN they are read without throwing
        THEN each of them is null`, () => {
      expect(
        readJsonFile(path.join(dir, 'missing.json'), { throws: false }),
      ).toBeNull();
      expect(readJsonFile(dir, { throws: false })).toBeNull();
      expect(
        readJsonFile(write('broken.json', '{"a": '), { throws: false }),
      ).toBeNull();
      expect(
        readJsonFile(write('empty.json', ''), { throws: false }),
      ).toBeNull();
    });
  });

  describe('writeJsonFile', () => {
    it(`GIVEN an object and two spaces
        WHEN it is written
        THEN the file holds the indented JSON followed by one line break`, () => {
      const file = path.join(dir, 'en.json');

      writeJsonFile(file, { a: { b: 'c' }, list: [1] }, 2);

      expect(fs.readFileSync(file)).toEqual(
        Buffer.from(
          '{\n  "a": {\n    "b": "c"\n  },\n  "list": [\n    1\n  ]\n}\n',
        ),
      );
    });

    it(`GIVEN an object and no spaces
        WHEN it is written
        THEN the file holds the JSON on one line followed by one line break`, () => {
      const file = path.join(dir, 'en.json');

      writeJsonFile(file, { a: 'ä', b: null });

      expect(fs.readFileSync(file)).toEqual(
        Buffer.from('{"a":"ä","b":null}\n', 'utf8'),
      );
    });

    it(`GIVEN an existing file
        WHEN a value is written to it
        THEN its content is replaced`, () => {
      const file = path.join(dir, 'en.json');
      fs.writeFileSync(file, '{"old": "a much longer content than the new"}\n');

      writeJsonFile(file, {}, 2);

      expect(fs.readFileSync(file, 'utf8')).toBe('{}\n');
    });

    it(`GIVEN a value JSON has no form for
        WHEN it is written
        THEN it fails saying so and no file is created`, () => {
      const file = path.join(dir, 'en.json');

      const error = catchError(() => writeJsonFile(file, undefined, 2));

      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe(
        'Converting undefined value to JSON is not supported',
      );
      expect(fs.existsSync(file)).toBe(false);
    });

    it(`GIVEN a file in a directory that doesn't exist
        WHEN it is written
        THEN it fails with ENOENT, as creating directories is not its job`, () => {
      const file = path.join(dir, 'missing', 'en.json');

      expect(catchError(() => writeJsonFile(file, {}, 2)).code).toBe('ENOENT');
      expect(fs.existsSync(path.join(dir, 'missing'))).toBe(false);
    });
  });
});
