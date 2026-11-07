import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors';

import { runOptimize } from './optimize';

describe('runOptimize', () => {
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-optimize-'));
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: object) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

    return filePath;
  }

  it(`GIVEN nested translation files holding translator comments
      WHEN they are optimized
      THEN every file is flattened and minified without the comments`, async () => {
    const en = write('en.json', {
      home: { title: 'Home', comment: 'the landing page' },
      comment: 'top level note',
    });
    const scoped = write('admin/en.json', { users: { add: 'Add' } });

    await runOptimize({ dist: dir, commentsKey: 'comment' });

    expect(fs.readFileSync(en, 'utf-8')).toBe('{"home.title":"Home"}');
    expect(fs.readFileSync(scoped, 'utf-8')).toBe('{"users.add":"Add"}');
    expect(log.mock.calls).toEqual([
      ['Transloco Optimize: found 2 translation files, optimizing...'],
      ['Transloco Optimize: Done! 🎊 '],
    ]);
  });

  it(`GIVEN a custom comments key
      WHEN the files are optimized
      THEN that key is dropped and the default one is kept`, async () => {
    const en = write('en.json', {
      title: 'Home',
      note: 'for translators',
      comment: 'a real key',
    });

    await runOptimize({ dist: dir, commentsKey: 'note' });

    expect(fs.readFileSync(en, 'utf-8')).toBe(
      '{"title":"Home","comment":"a real key"}',
    );
  });

  it(`GIVEN a directory without translation files
      WHEN it is optimized
      THEN it fails naming the resolved directory`, async () => {
    const dist = path.join(dir, 'missing');

    const error = await runOptimize({ dist, commentsKey: 'comment' }).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: `Transloco Optimize: No Translation path found under: ${dist}`,
    });
    expect(log).not.toHaveBeenCalled();
  });

  it(`GIVEN a translation file that is not valid JSON
      WHEN the directory is optimized
      THEN it rejects instead of reporting success`, async () => {
    const filePath = path.join(dir, 'en.json');
    fs.writeFileSync(filePath, '{"a": }', 'utf-8');

    await expect(
      runOptimize({ dist: dir, commentsKey: 'comment' }),
    ).rejects.toThrow(/JSON/);

    expect(log).not.toHaveBeenCalledWith('Transloco Optimize: Done! 🎊 ');
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('{"a": }');
  });
});
