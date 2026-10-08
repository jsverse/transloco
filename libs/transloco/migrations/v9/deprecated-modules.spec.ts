import { migrateDeprecatedModulesSource } from './deprecated-modules';

const join = (...lines: string[]) => lines.join('\n');

describe('migrateDeprecatedModulesSource', () => {
  describe('TranslocoModule', () => {
    it(`GIVEN a component importing TranslocoModule
        WHEN the source is migrated
        THEN the directive and pipe replace it in the imports and the import statement`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `@Component({ imports: [TranslocoModule] })`,
          `export class A {}`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `@Component({ imports: [TranslocoDirective, TranslocoPipe] })`,
          `export class A {}`,
        ),
      );
      expect(result?.migrated).toBe(1);
      expect(result?.unresolved).toEqual([]);
    });

    it(`GIVEN TranslocoModule imported next to other symbols
        WHEN the source is migrated
        THEN the other symbols are kept`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule, TranslocoService } from '@jsverse/transloco';`,
          `const imports = [TranslocoModule];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoService, TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [TranslocoDirective, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN the directive already imported
        WHEN the source is migrated
        THEN it is not imported twice`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoDirective, TranslocoModule } from '@jsverse/transloco';`,
          `const imports = [TranslocoModule];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [TranslocoDirective, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN the directive already imported under an alias
        WHEN the source is migrated
        THEN the alias is used`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoDirective as Dir, TranslocoModule } from '@jsverse/transloco';`,
          `const imports = [TranslocoModule];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective as Dir, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [Dir, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN TranslocoModule imported under an alias
        WHEN the source is migrated
        THEN the aliased usage is rewritten`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule as T } from '@jsverse/transloco';`,
          `const imports = [T];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [TranslocoDirective, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN TranslocoModule used in a form other than an array element
        WHEN the source is migrated
        THEN it is reported with its line and the import is kept`, () => {
      const source = join(
        `import { TranslocoModule } from '@jsverse/transloco';`,
        ``,
        `export const shared = TranslocoModule;`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoModule', line: 3 },
      ]);
    });

    it(`GIVEN one rewritable and one unrewritable usage
        WHEN the source is migrated
        THEN the deprecated import is kept for the one left behind`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `const imports = [TranslocoModule];`,
          `export const shared = TranslocoModule;`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoModule, TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [TranslocoDirective, TranslocoPipe];`,
          `export const shared = TranslocoModule;`,
        ),
      );
      expect(result?.unresolved).toHaveLength(1);
    });

    it(`GIVEN the file already uses TranslocoPipe for something else
        WHEN the source is migrated
        THEN the pipe is imported under an alias instead of a second binding`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `import { TranslocoPipe } from './my-pipes';`,
          `const imports = [TranslocoModule, TranslocoPipe];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe as TranslocoPipe_1 } from '@jsverse/transloco';`,
          `import { TranslocoPipe } from './my-pipes';`,
          `const imports = [TranslocoDirective, TranslocoPipe_1, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN the file declares its own TranslocoDirective
        WHEN the source is migrated
        THEN the directive is imported under an alias and reused for every usage`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `class TranslocoDirective {}`,
          `const a = [TranslocoModule];`,
          `const b = [TranslocoModule];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective as TranslocoDirective_1, TranslocoPipe } from '@jsverse/transloco';`,
          `class TranslocoDirective {}`,
          `const a = [TranslocoDirective_1, TranslocoPipe];`,
          `const b = [TranslocoDirective_1, TranslocoPipe];`,
        ),
      );
    });

    it(`GIVEN a same-named symbol from another package
        WHEN the source is migrated
        THEN nothing changes`, () => {
      expect(
        migrateDeprecatedModulesSource(
          join(
            `import { TranslocoModule } from 'some-other-package';`,
            `const imports = [TranslocoModule];`,
          ),
        ),
      ).toBeNull();
    });

    it(`GIVEN a file that never mentions the modules
        WHEN the source is migrated
        THEN nothing changes`, () => {
      expect(
        migrateDeprecatedModulesSource(
          `import { TranslocoService } from '@jsverse/transloco';`,
        ),
      ).toBeNull();
    });
  });

  describe('NgModule exports', () => {
    it(`GIVEN an exports-only module with no imports property
        WHEN the source is migrated
        THEN the standalone names are also added to imports`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `@NgModule({ exports: [TranslocoModule] })`,
          `export class TranslocoRootModule {}`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `@NgModule({ exports: [TranslocoDirective, TranslocoPipe], imports: [TranslocoDirective, TranslocoPipe] })`,
          `export class TranslocoRootModule {}`,
        ),
      );
      expect(result?.unresolved).toEqual([]);
    });

    it(`GIVEN a module that exports and already imports the module
        WHEN the source is migrated
        THEN the imports array is not given duplicate entries`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoModule } from '@jsverse/transloco';`,
          `@NgModule({ imports: [TranslocoModule], exports: [TranslocoModule] })`,
          `export class SharedModule {}`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `@NgModule({ imports: [TranslocoDirective, TranslocoPipe], exports: [TranslocoDirective, TranslocoPipe] })`,
          `export class SharedModule {}`,
        ),
      );
    });

    it(`GIVEN a module that exports the locale module next to an empty imports array
        WHEN the source is migrated
        THEN the pipes are added to both arrays`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoLocaleModule } from '@jsverse/transloco-locale';`,
          `@NgModule({ imports: [], exports: [TranslocoLocaleModule] })`,
          `export class SharedModule {}`,
        ),
      );

      expect(result?.content).toContain(
        `imports: [TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe]`,
      );
      expect(result?.content).toContain(
        `exports: [TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe]`,
      );
    });

    it(`GIVEN exports next to an imports given by reference
        WHEN the source is migrated
        THEN it is reported rather than left exporting an unimported directive`, () => {
      const source = join(
        `import { TranslocoModule } from '@jsverse/transloco';`,
        `@NgModule({ imports: sharedImports, exports: [TranslocoModule] })`,
        `export class SharedModule {}`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoModule', line: 2 },
      ]);
    });
  });

  describe('usages this migration cannot rewrite', () => {
    it(`GIVEN a namespace import
        WHEN the source is migrated
        THEN the usage is reported and the file is left as it was`, () => {
      const source = join(
        `import * as transloco from '@jsverse/transloco';`,
        `const imports = [transloco.TranslocoModule];`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoModule', line: 2 },
      ]);
    });

    it(`GIVEN a barrel re-export
        WHEN the source is migrated
        THEN the re-exported name is reported`, () => {
      const source = join(
        `export { TranslocoModule } from '@jsverse/transloco';`,
        `export { TranslocoLocaleModule } from '@jsverse/transloco-locale';`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoModule', line: 1 },
        { name: 'TranslocoLocaleModule', line: 2 },
      ]);
    });

    it(`GIVEN a namespace import of an untouched symbol
        WHEN the source is migrated
        THEN nothing is reported`, () => {
      expect(
        migrateDeprecatedModulesSource(
          join(
            `import * as transloco from '@jsverse/transloco';`,
            `const service = transloco.TranslocoService;`,
            `const x = 'TranslocoModule';`,
          ),
        ),
      ).toBeNull();
    });
  });

  describe('TranslocoLocaleModule', () => {
    it(`GIVEN a component importing TranslocoLocaleModule
        WHEN the source is migrated
        THEN the four locale pipes replace it`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          `import { TranslocoLocaleModule } from '@jsverse/transloco-locale';`,
          `const imports = [TranslocoLocaleModule];`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe } from '@jsverse/transloco-locale';`,
          `const imports = [TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe];`,
        ),
      );
    });
  });

  describe('TranslocoTestingModule', () => {
    const header = `import { TranslocoTestingModule } from '@jsverse/transloco';`;

    it(`GIVEN forRoot in the imports of a TestBed configuration
        WHEN the source is migrated
        THEN the directive and pipe stay in imports and the provider is added to providers`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `TestBed.configureTestingModule({`,
          `  imports: [TranslocoTestingModule.forRoot({ langs: { en } })],`,
          `});`,
        ),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe, provideTranslocoTesting } from '@jsverse/transloco';`,
          `TestBed.configureTestingModule({`,
          `  imports: [TranslocoDirective, TranslocoPipe], providers: [provideTranslocoTesting({ langs: { en } })],`,
          `});`,
        ),
      );
      expect(result?.migrated).toBe(1);
      expect(result?.unresolved).toEqual([]);
    });

    it(`GIVEN forRoot next to an existing providers array
        WHEN the source is migrated
        THEN the provider is prepended, so the user's providers still win`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `TestBed.configureTestingModule({`,
          `  imports: [TranslocoTestingModule.forRoot({ langs })],`,
          `  providers: [Foo, Bar],`,
          `});`,
        ),
      );

      expect(result?.content).toContain(
        `providers: [provideTranslocoTesting({ langs }), Foo, Bar],`,
      );
      expect(result?.content).toContain(
        `imports: [TranslocoDirective, TranslocoPipe],`,
      );
      expect(result?.content.match(/providers:/g)).toHaveLength(1);
    });

    it(`GIVEN forRoot next to an empty providers array
        WHEN the source is migrated
        THEN the provider becomes its only element`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `TestBed.configureTestingModule({`,
          `  imports: [TranslocoTestingModule.forRoot({ langs })],`,
          `  providers: [],`,
          `});`,
        ),
      );

      expect(result?.content).toContain(
        `providers: [provideTranslocoTesting({ langs })],`,
      );
    });

    it(`GIVEN forRoot next to other imports
        WHEN the source is migrated
        THEN the other imports are kept in place`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `@NgModule({ imports: [Foo, TranslocoTestingModule.forRoot(opts), Bar] })`,
          `export class T {}`,
        ),
      );

      expect(result?.content).toContain(
        `imports: [Foo, TranslocoDirective, TranslocoPipe, Bar], providers: [provideTranslocoTesting(opts)]`,
      );
    });

    it(`GIVEN forRoot returned from a helper
        WHEN the source is migrated
        THEN it is reported and left as it was`, () => {
      const source = join(
        header,
        ``,
        `export function getModule() {`,
        `  return TranslocoTestingModule.forRoot({ langs });`,
        `}`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoTestingModule', line: 4 },
      ]);
    });

    it(`GIVEN providers passed by reference next to forRoot
        WHEN the source is migrated
        THEN it is reported rather than overwritten`, () => {
      const source = join(
        header,
        `TestBed.configureTestingModule({`,
        `  imports: [TranslocoTestingModule.forRoot({ langs })],`,
        `  providers,`,
        `});`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.unresolved).toHaveLength(1);
    });

    it(`GIVEN two forRoot calls in one imports array
        WHEN the source is migrated
        THEN the file is left as it was and each call is reported`, () => {
      // Moved to providers, the first would override the second regardless of
      // the order they had as imports, so neither is touched.
      const source = join(
        header,
        `TestBed.configureTestingModule({`,
        `  imports: [TranslocoTestingModule.forRoot(a), TranslocoTestingModule.forRoot(b)],`,
        `});`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoTestingModule', line: 3 },
        { name: 'TranslocoTestingModule', line: 3 },
      ]);
    });

    it(`GIVEN a spread in the object holding forRoot
        WHEN the source is migrated
        THEN it is reported rather than shadowing the spread providers`, () => {
      const source = join(
        header,
        `TestBed.configureTestingModule({`,
        `  ...baseConfig,`,
        `  imports: [TranslocoTestingModule.forRoot({ langs })],`,
        `});`,
      );
      const result = migrateDeprecatedModulesSource(source);

      expect(result?.content).toBe(source);
      expect(result?.migrated).toBe(0);
      expect(result?.unresolved).toEqual([
        { name: 'TranslocoTestingModule', line: 4 },
      ]);
    });

    it(`GIVEN quoted imports and providers keys
        WHEN the source is migrated
        THEN the existing providers array is reused, not duplicated`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `TestBed.configureTestingModule({`,
          `  'imports': [TranslocoTestingModule.forRoot({ langs })],`,
          `  'providers': [Foo],`,
          `});`,
        ),
      );

      expect(result?.content).toContain(
        `'providers': [provideTranslocoTesting({ langs }), Foo]`,
      );
      expect(result?.content).toContain(
        `'imports': [TranslocoDirective, TranslocoPipe]`,
      );
      expect(result?.content.match(/providers/g)).toHaveLength(1);
    });

    it(`GIVEN a computed string-literal providers key
        WHEN the source is migrated
        THEN the existing providers array is reused, not duplicated`, () => {
      const result = migrateDeprecatedModulesSource(
        join(
          header,
          `TestBed.configureTestingModule({`,
          `  imports: [TranslocoTestingModule.forRoot({ langs })],`,
          `  ['providers']: [Foo],`,
          `});`,
        ),
      );

      expect(result?.content).toContain(
        `['providers']: [provideTranslocoTesting({ langs }), Foo]`,
      );
    });

    it(`GIVEN the bare TranslocoTestingModule in imports
        WHEN the source is migrated
        THEN it is replaced by the directive and pipe it exported`, () => {
      const result = migrateDeprecatedModulesSource(
        join(header, `const imports = [TranslocoTestingModule];`),
      );

      expect(result?.content).toBe(
        join(
          `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
          `const imports = [TranslocoDirective, TranslocoPipe];`,
        ),
      );
    });
  });
});
