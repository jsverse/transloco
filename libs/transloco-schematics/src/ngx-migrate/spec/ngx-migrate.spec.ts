// noinspection AngularUndefinedBinding

import * as nodePath from 'node:path';

import { vol } from 'memfs';
import { glob } from 'glob';

import { run } from '../index';
import { PIPE_IN_BINDING_REGEX, PIPE_REGEX } from '../migration-matchers';

// Mock the fs module with memfs
jest.mock('node:fs/promises', () => {
  const originalModule = jest.requireActual('node:fs/promises');
  return {
    ...originalModule,
    readFile: jest.fn().mockImplementation((path, options) => {
      return Promise.resolve(vol.readFileSync(path, options));
    }),
    writeFile: jest.fn().mockImplementation((path, content, options) => {
      vol.writeFileSync(path, content, options);
      return Promise.resolve();
    }),
  };
});

jest.mock('glob', () => {
  const originalModule = jest.requireActual('glob');
  return {
    ...originalModule,
    sync: jest.fn().mockImplementation((pattern) => {
      // Get the directory from the pattern
      const [dir] = pattern.split('/**');

      return vol
        .readdirSync(dir, { recursive: true })
        .map((file) => nodePath.join(dir, file));
    }),
  };
});

describe('ngx-translate migration', () => {
  beforeEach(() => {
    // Reset the in-memory file system before each test
    vol.reset();
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
        THEN all translate pipes are replaced with transloco pipes`, async () => {
      // Define the template directories
      const ngxTranslateDir = nodePath.join(
        __dirname,
        'templates/pipes/ngx-translate',
      );
      const translocoDir = nodePath.join(
        __dirname,
        'templates/pipes/transloco',
      );

      // Find all template files using glob
      const templateFiles = glob.sync('*.html', { cwd: ngxTranslateDir });

      // Create directories in memfs
      vol.mkdirSync(ngxTranslateDir, { recursive: true });
      vol.mkdirSync(translocoDir, { recursive: true });

      // Copy template files into memfs
      const fsReadFile = jest.requireActual('node:fs/promises').readFile;
      for (const file of templateFiles) {
        // Read the original files using the real fs module
        const sourceContent = await fsReadFile(
          nodePath.join(ngxTranslateDir, file),
          'utf8',
        );

        // Write to memfs
        vol.writeFileSync(nodePath.join(ngxTranslateDir, file), sourceContent);
      }
      vol
        .readdirSync(ngxTranslateDir, { recursive: true })
        .forEach(console.log);
      jest.spyOn(process, 'cwd').mockImplementation(() => __dirname);
      // Run the migration
      await run({ path: 'templates/pipes/ngx-translate' });

      // Verify that each file was updated correctly
      for (const file of templateFiles) {
        const updatedContent = vol.readFileSync(
          nodePath.join(ngxTranslateDir, file),
          'utf8',
        );
        const expectedContent = await fsReadFile(
          nodePath.join(translocoDir, file),
          'utf8',
        );
        expect(updatedContent).toBe(expectedContent);
      }
    });
  });
});
