import {PIPE_IN_BINDING_REGEX, PIPE_REGEX} from '../migrate/ngx-translate-migration';

describe('ngx-translate migration', () => {

  describe('Positive regex tests', () => {

    describe('Pipe in binding', () => {
      test.each([
        {
          testCase: `<component [header]="'hello.world' | translate">`,
          match: `]="'hello.world' | translate"`
        },
        {
          testCase: `<component [header]="'hello.world' | translate | anotherPipe">`,
          match: `]="'hello.world' | translate | anotherPipe"`
        },
        {
          testCase: `<component [header]="'hello' | translate:params | anotherPipe">`,
          match: `]="'hello' | translate:params | anotherPipe"`
        },
        {
          testCase: `<component [title]="titleMap[reportType] | translate">`,
          match: `]="titleMap[reportType] | translate"`
        },
        {
          testCase: `<component [matTooltip]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')">`,
          match: `]="('foo.bar' | translate) + ': ' + (value | number: '1.0-2')"`
        },
        {
          testCase: `<compnent [title]="'Hello World ' + ('mom' | translate) | fooBar">`,
          match: `]="'Hello World ' + ('mom' | translate) | fooBar"`
        }
      ])('Case: $testCase; Match: $match', ({testCase, match}) => {
        const regex = new RegExp(PIPE_IN_BINDING_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toMatchObject([match]);
      });
    });

    describe('Pipe', () => {
      test.each([
        {
          testCase: `<component>{{ "hello.world" | translate }}</component>`,
          match: `{{ "hello.world" | translate }}`
        },
        {
          testCase: `<component>{{ "hello.world" | translate | anotherPipe | oneMore }}</component>`,
          match: `{{ "hello.world" | translate | anotherPipe | oneMore }}`
        },
        {
          testCase: `<component>{{ "hello" | translate: { name: 'John' } }}</component>`,
          match: `{{ "hello" | translate: { name: 'John' } }}`
        },
        {
          testCase: `<component>{{ titleMap[reportType] | translate }}</component>`,
          match: `{{ titleMap[reportType] | translate }}`
        },
        {
          testCase: `<component>{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}</component>`,
          match: `{{ ('foo.bar' | translate) + ': ' + (value | number: '1.0-2') }}`
        },
        {
          testCase: `<compnent>{{ 'Hello, ' + ('mom' | translate) | fooBar }}</compnent>`,
          match: `{{ 'Hello, ' + ('mom' | translate) | fooBar }}`
        }
      ])('Case: $testCase; Match: $match', ({testCase, match}) => {
        const regex = new RegExp(PIPE_REGEX, 'gm');
        const result = testCase.match(regex);

        expect(result).toMatchObject([match]);
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
});
