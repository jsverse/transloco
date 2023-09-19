// noinspection AngularUndefinedBinding

import * as nodePath from 'node:path';
import {readFile} from 'node:fs/promises';

import {replaceInFile, ReplaceInFileConfig} from 'replace-in-file';
import {glob} from 'glob';

import {PIPE_IN_BINDING_REGEX, PIPE_REGEX, run} from '../migrate/ngx-translate-migration';

import Mock = jest.Mock;

jest.mock('replace-in-file');

describe('ngx-translate migration', () => {

  describe('Positive regex tests', () => {

    describe('Pipe in binding', () => {
      test.each([
        {
          testCase: `<component [header]="'hello.world' | translate">`,
          match: [`]="'hello.world' | translate"`]
        },
        {
          testCase: `<component [header]="'hello.world' | translate | anotherPipe">`,
          match: [`]="'hello.world' | translate | anotherPipe"`]
        },
        {
          testCase: `<component [header]="'hello' | translate:params | anotherPipe">`,
          match: [`]="'hello' | translate:params | anotherPipe"`]
        },
        {
          testCase: `<component [title]="titleMap[reportType] | translate">`,
          match: [`]="titleMap[reportType] | translate"`]
        },
        {
          testCase: `<component [matTooltip]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')">`,
          match: [`]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')"`]
        },
        {
          testCase: `<compnent [title]="'Hello, ' + ('mom' | translate) | fooBar">`,
          match: [`]="'Hello, ' + ('mom' | translate) | fooBar"`]
        },
        {
          testCase: `<edge-wizard-step [label]="'Restore Options' | translate" [validatingMessage]="'Processing archive...'|translate"`,
          match: [`]="'Restore Options' | translate"`, `]="'Processing archive...'|translate"`]
        }
      ])('Case: $testCase; Match: $match', ({testCase, match}) => {
        const regex = new RegExp(PIPE_IN_BINDING_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toMatchObject(match);
      });
    });

    describe('Pipe', () => {
      test.each([
        {
          testCase: `<component>{{ "hello.world" | translate }}</component>`,
          match: [`{{ "hello.world" | translate }}`]
        },
        {
          testCase: `<component>{{ "hello.world" | translate | anotherPipe | oneMore }}</component>`,
          match: [`{{ "hello.world" | translate | anotherPipe | oneMore }}`]
        },
        {
          testCase: `<component>{{ "hello" | translate: { name: 'John' } }}</component>`,
          match: [`{{ "hello" | translate: { name: 'John' } }}`]
        },
        {
          testCase: `<component>{{ titleMap[reportType] | translate }}</component>`,
          match: [`{{ titleMap[reportType] | translate }}`]
        },
        {
          testCase: `<component>{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}</component>`,
          match: [`{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}`]
        },
        {
          testCase: `<compnent>{{ 'Hello, ' + ('mom' | translate) | fooBar }}</compnent>`,
          match: [`{{ 'Hello, ' + ('mom' | translate) | fooBar }}`]
        },
        {
          testCase: `{{"1" | translate}} {{errorCounter}} {{"2" | translate}}`,
          match: [`{{"1" | translate}}`, `{{"2" | translate}}`]
        }
      ])('Case: $testCase; Match: $match', ({testCase, match}) => {
        const regex = new RegExp(PIPE_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toMatchObject(match);
      });
    });
  });

  describe('Negative regex tests', () => {
    
    describe('Pipe in binding', () => {
      test.each([
        {
          testCase: `<component [header]="'hello.world' | transloco">`
        },
        {
          testCase: `<component [header]="'hello.world' | somePipe | anotherPipe">`
        },
        {
          testCase: `<component [header]="'hello' | transloco:params | anotherPipe">`
        },
        {
          testCase: `<component [title]="titleMap[reportType] | fooBar">`
        },
        {
          testCase: `<component [matTooltip]="('foo.bar' | transloco) + ': ' + (value | number: '1.0-2')">`
        },
        {
          testCase: `<compnent [title]="'Hello World ' + ('mom' | transloco) | fooBar">`
        }
      ])('Case: $testCase', ({testCase}) => {
        const regex = new RegExp(PIPE_IN_BINDING_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toBeNull();
      });
    });
    
    describe('Pipe', () => {
      test.each([
        {
          testCase: `<component>{{ "hello.world" | transloco }}</component>`
        },
        {
          testCase: `<component>{{ "hello.world" | transloco | anotherPipe | oneMore }}</component>`
        },
        {
          testCase: `<component>{{ "hello" | transloco: { name: 'John' } }}</component>`
        },
        {
          testCase: `<component>{{ titleMap[reportType] | somePipe }}</component>`
        },
        {
          testCase: `<component>{{ ('foo.bar' | transloco) + ': ' + (value | number: '1.0-2') }}</component>`
        },
        {
          testCase: `<compnent>{{ 'Hello, ' + ('mom' | transloco) | fooBar }}</compnent>`
        }
      ])('Case: $testCase', ({testCase}) => {
        const regex = new RegExp(PIPE_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toBeNull();
      });
    });
  
  });

  describe('HTML template', () => {

    it('should replace html template content', async () => {
      const replacements: Record<string, string> = {},
        isWindows = process.platform === 'win32';
      
      (replaceInFile as Mock).mockImplementation(
        async (config: ReplaceInFileConfig): Promise<void> => {
          const path = config.files as string,
            regex = config.from as RegExp,
            replacer = config.to as (match: string) => string;
          
          const files = await glob(path, {windowsPathsNoEscape: isWindows});
          
          for (const fullPath of files) {
            const filename = nodePath.parse(fullPath).base,
              content = replacements[filename] ?? await readFile(fullPath, {encoding: 'utf-8'});
            
            replacements[filename] = content.replace(regex, replacer);
          }
        }
      );

      const ngxTranslateTemplatePath = './src/tests/templates/pipes/ngx-translate';

      await run(ngxTranslateTemplatePath);

      const filenames = Object.keys(replacements);

      for(const filename of filenames) {
        const resultPath = nodePath.join(__dirname, './templates/pipes/transloco', filename),
          resultContent = await readFile(resultPath, {encoding: 'utf-8'});

        expect(replacements[filename]).toBe(resultContent);
      }
    });

  });
});
