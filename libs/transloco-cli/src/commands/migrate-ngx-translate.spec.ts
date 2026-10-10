import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';

import { runMigrateNgxTranslate } from './migrate-ngx-translate.js';

describe('runMigrateNgxTranslate', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-migrate-ngx-')),
    );
    process.chdir(dir);
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');

  it(`GIVEN a folder with templates and sources
      WHEN the command runs
      THEN they are migrated and the greeting is printed`, () => {
    write('src/app/a.html', `<p>{{ 'x' | translate }}</p>\n`);
    write(
      'src/app/a.ts',
      `import { TranslateService } from '@ngx-translate/core';\n`,
    );

    runMigrateNgxTranslate({ input: 'src/app' });

    expect(read('src/app/a.html')).toBe(`<p>{{ 'x' | transloco }}</p>\n`);
    expect(read('src/app/a.ts')).toBe(
      `import { TranslocoService } from '@jsverse/transloco';\n`,
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Done!'));
  });

  it(`GIVEN a folder holding templates alone
      WHEN the command runs
      THEN it migrates them, the sources are not required`, () => {
    write('app/a.html', `<p>{{ 'x' | translate }}</p>\n`);

    runMigrateNgxTranslate({ input: 'app' });

    expect(read('app/a.html')).toBe(`<p>{{ 'x' | transloco }}</p>\n`);
  });

  it(`GIVEN a folder holding sources alone
      WHEN the command runs
      THEN it migrates them, the templates are not required`, () => {
    write(
      'app/a.ts',
      `import { TranslateModule } from '@ngx-translate/core';\n`,
    );

    runMigrateNgxTranslate({ input: 'app' });

    expect(read('app/a.ts')).toBe(
      `import { TranslocoModule } from '@jsverse/transloco';\n`,
    );
  });

  it(`GIVEN an input that does not exist
      WHEN the command runs
      THEN it fails naming the folder before printing or writing anything`, () => {
    write('other/a.html', `<p>{{ 'x' | translate }}</p>\n`);

    expect(() => runMigrateNgxTranslate({ input: 'src/app' })).toThrow(
      new CliError(
        'Transloco Migrate: The input folder does not exist: src/app',
      ),
    );
    expect(log).not.toHaveBeenCalled();
    expect(read('other/a.html')).toBe(`<p>{{ 'x' | translate }}</p>\n`);
  });

  it(`GIVEN an input that is a file
      WHEN the command runs
      THEN it fails saying it is no folder`, () => {
    write('app.html', '');

    expect(() => runMigrateNgxTranslate({ input: 'app.html' })).toThrow(
      new CliError(
        'Transloco Migrate: The input folder is not a folder: app.html',
      ),
    );
  });

  it(`GIVEN a folder with no .html and no .ts file
      WHEN the command runs
      THEN it fails saying which extensions were looked for, and prints nothing`, () => {
    write('src/app/styles.css', '.a {}');
    write('src/app/readme.md', '# a');

    expect(() => runMigrateNgxTranslate({ input: 'src/app' })).toThrow(
      new CliError('Transloco Migrate: No .html or .ts files found in src/app'),
    );
    expect(log).not.toHaveBeenCalled();
  });

  it(`GIVEN an input outside the working directory, given absolute
      WHEN the command runs
      THEN it is migrated like any other`, () => {
    const outside = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-migrate-out-')),
    );

    try {
      fs.writeFileSync(path.join(outside, 'a.html'), `{{ 'x' | translate }}`);

      runMigrateNgxTranslate({ input: outside });

      expect(fs.readFileSync(path.join(outside, 'a.html'), 'utf-8')).toBe(
        `{{ 'x' | transloco }}`,
      );
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});
