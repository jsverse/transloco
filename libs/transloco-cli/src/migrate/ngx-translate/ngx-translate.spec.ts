// noinspection AngularUndefinedBinding

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';

import { migrateNgxTranslate } from './migrate-ngx-translate.js';
import { PIPE_IN_BINDING_REGEX, PIPE_REGEX } from './migration-matchers.js';

describe('ngx-translate migration', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-ngx-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('Positive regex tests', () => {
    describe('Pipe in binding', () => {
      test.each([
        {
          testCase: `<component [header]="'hello.world' | translate">`,
          match: [`]="'hello.world' | translate"`],
        },
        {
          testCase: `<component [header]="'hello.world' | translate | anotherPipe">`,
          match: [`]="'hello.world' | translate | anotherPipe"`],
        },
        {
          testCase: `<component [header]="'hello' | translate:params | anotherPipe">`,
          match: [`]="'hello' | translate:params | anotherPipe"`],
        },
        {
          testCase: `<component [title]="titleMap[reportType] | translate">`,
          match: [`]="titleMap[reportType] | translate"`],
        },
        {
          testCase: `<component [matTooltip]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')">`,
          match: [
            `]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')"`,
          ],
        },
        {
          testCase: `<compnent [title]="'Hello, ' + ('mom' | translate) | fooBar">`,
          match: [`]="'Hello, ' + ('mom' | translate) | fooBar"`],
        },
        {
          testCase: `<edge-wizard-step [label]="'Restore Options' | translate" [validatingMessage]="'Processing archive...'|translate"`,
          match: [
            `]="'Restore Options' | translate"`,
            `]="'Processing archive...'|translate"`,
          ],
        },
      ])(
        `GIVEN test case with translate pipe in binding: $testCase
          WHEN PIPE_IN_BINDING_REGEX is applied
          THEN it matches: $match`,
        ({ testCase, match }) => {
          const regex = new RegExp(PIPE_IN_BINDING_REGEX, 'gm');
          const result = testCase.match(regex);

          expect(result).toMatchObject(match);
        },
      );
    });

    describe('Pipe', () => {
      test.each([
        {
          testCase: `<component>{{ "hello.world" | translate }}</component>`,
          match: [`{{ "hello.world" | translate }}`],
        },
        {
          testCase: `<component>{{ "hello.world" | translate | anotherPipe | oneMore }}</component>`,
          match: [`{{ "hello.world" | translate | anotherPipe | oneMore }}`],
        },
        {
          testCase: `<component>{{ "hello" | translate: { name: 'John' } }}</component>`,
          match: [`{{ "hello" | translate: { name: 'John' } }}`],
        },
        {
          testCase: `<component>{{ titleMap[reportType] | translate }}</component>`,
          match: [`{{ titleMap[reportType] | translate }}`],
        },
        {
          testCase: `<component>{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}</component>`,
          match: [
            `{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}`,
          ],
        },
        {
          testCase: `<compnent>{{ 'Hello, ' + ('mom' | translate) | fooBar }}</compnent>`,
          match: [`{{ 'Hello, ' + ('mom' | translate) | fooBar }}`],
        },
        {
          testCase: `{{"1" | translate}} {{errorCounter}} {{"2" | translate}}`,
          match: [`{{"1" | translate}}`, `{{"2" | translate}}`],
        },
      ])(
        `GIVEN test case with translate pipe in interpolation: $testCase
          WHEN PIPE_REGEX is applied
          THEN it matches: $match`,
        ({ testCase, match }) => {
          const regex = new RegExp(PIPE_REGEX, 'gm');
          const result = testCase.match(regex);

          expect(result).toMatchObject(match);
        },
      );
    });
  });

  describe('Negative regex tests', () => {
    describe('Pipe in binding', () => {
      test.each([
        {
          testCase: `<component [header]="'hello.world' | transloco">`,
        },
        {
          testCase: `<component [header]="'hello.world' | somePipe | anotherPipe">`,
        },
        {
          testCase: `<component [header]="'hello' | transloco:params | anotherPipe">`,
        },
        {
          testCase: `<component [title]="titleMap[reportType] | fooBar">`,
        },
        {
          testCase: `<component [matTooltip]="('foo.bar' | transloco) + ': ' + (value | number: '1.0-2')">`,
        },
        {
          testCase: `<compnent [title]="'Hello World ' + ('mom' | transloco) | fooBar">`,
        },
        {
          testCase: `<a [title]="'admin.1' | lowercase
              | translate"
          </a>`,
        },
      ])(
        `GIVEN test case without translate pipe in binding: $testCase
          WHEN PIPE_IN_BINDING_REGEX is applied
          THEN it does not match`,
        ({ testCase }) => {
          const regex = new RegExp(PIPE_IN_BINDING_REGEX, 'gm');
          const result = testCase.match(regex);

          expect(result).toBeNull();
        },
      );
    });

    describe('Pipe', () => {
      test.each([
        {
          testCase: `<component>{{ "hello.world" | transloco }}</component>`,
        },
        {
          testCase: `<component>{{ "hello.world" | transloco | anotherPipe | oneMore }}</component>`,
        },
        {
          testCase: `<component>{{ "hello" | transloco: { name: 'John' } }}</component>`,
        },
        {
          testCase: `<component>{{ titleMap[reportType] | somePipe }}</component>`,
        },
        {
          testCase: `<component>{{ ('foo.bar' | transloco) + ': ' + (value | number: '1.0-2') }}</component>`,
        },
        {
          testCase: `<compnent>{{ 'Hello, ' + ('mom' | transloco) | fooBar }}</compnent>`,
        },
      ])(
        `GIVEN test case without translate pipe in interpolation: $testCase
          WHEN PIPE_REGEX is applied
          THEN it does not match`,
        ({ testCase }) => {
          const regex = new RegExp(PIPE_REGEX, 'gm');
          const result = testCase.match(regex);

          expect(result).toBeNull();
        },
      );
    });
  });

  describe('HTML template', () => {
    it(`GIVEN HTML template files with ngx-translate pipes
        WHEN migration runs
        THEN all translate pipes are replaced with transloco pipes`, () => {
      // Define the template directories
      const ngxTranslateDir = path.join(
        import.meta.dirname,
        'tests/templates/pipes/ngx-translate',
      );
      const translocoDir = path.join(
        import.meta.dirname,
        'tests/templates/pipes/transloco',
      );

      // Find all template files
      const templateFiles = fs
        .readdirSync(ngxTranslateDir)
        .filter((file) => file.endsWith('.html'));

      // Copy template files into the folder that is migrated
      for (const file of templateFiles) {
        fs.copyFileSync(path.join(ngxTranslateDir, file), path.join(dir, file));
      }

      // Run the migration
      migrateNgxTranslate({ input: dir });

      // Verify that each file was updated correctly
      for (const file of templateFiles) {
        const updatedContent = fs.readFileSync(path.join(dir, file), 'utf8');
        const expectedContent = fs.readFileSync(
          path.join(translocoDir, file),
          'utf8',
        );
        expect(updatedContent).toBe(expectedContent);
      }
    });
  });
});
