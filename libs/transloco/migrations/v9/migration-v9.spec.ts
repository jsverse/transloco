import * as nodePath from 'node:path';

import { HostTree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { createWorkspace } from '../../schematics-core/testing';

import { migrateInlineTemplates, migrateTemplate } from './template-utils';
import {
  providesGlobalTranslateFn,
  usesGlobalTranslateFn,
} from './global-translate-fn';

const collectionPath = nodePath.join(__dirname, '../migration.json');

describe('migrateTemplate', () => {
  it(`GIVEN a static translocoRead attribute
      WHEN the template is migrated
      THEN it is renamed to translocoPrefix`, () => {
    const result = migrateTemplate(
      `<ng-template transloco let-t translocoRead="templates.translations"></ng-template>`,
    );

    expect(result?.content).toBe(
      `<ng-template transloco let-t translocoPrefix="templates.translations"></ng-template>`,
    );
    expect(result?.renamed).toBe(1);
    expect(result?.removed).toBe(0);
  });

  it(`GIVEN a bound translocoRead attribute
      WHEN the template is migrated
      THEN the binding brackets are preserved`, () => {
    const result = migrateTemplate(
      `<ng-template transloco let-b [translocoRead]="'nested.translation'"></ng-template>`,
    );

    expect(result?.content).toBe(
      `<ng-template transloco let-b [translocoPrefix]="'nested.translation'"></ng-template>`,
    );
  });

  it(`GIVEN an element carrying both translocoRead and translocoPrefix
      WHEN the template is migrated
      THEN translocoRead is dropped rather than renamed`, () => {
    // v8 resolved `this.prefix || this.inlineRead`, so prefix already won.
    // Renaming would emit a duplicate attribute, which fails to parse.
    const result = migrateTemplate(
      `<ng-template transloco translocoRead="a" translocoPrefix="b"></ng-template>`,
    );

    expect(result?.content).toBe(
      `<ng-template transloco translocoPrefix="b"></ng-template>`,
    );
    expect(result?.removed).toBe(1);
    expect(result?.renamed).toBe(0);
  });

  it(`GIVEN the *transloco microsyntax using the read key
      WHEN the template is migrated
      THEN the key is renamed to prefix`, () => {
    const result = migrateTemplate(
      `<ng-container *transloco="let t; read: 'ternary.nested'"></ng-container>`,
    );

    expect(result?.content).toBe(
      `<ng-container *transloco="let t; prefix: 'ternary.nested'"></ng-container>`,
    );
    expect(result?.renamed).toBe(1);
  });

  it(`GIVEN the *transloco microsyntax combining read with other keys
      WHEN the template is migrated
      THEN the surrounding keys are preserved`, () => {
    const result = migrateTemplate(
      `<section *transloco="let t; read: 'a'; scope: 'lazy-page'; lang: 'es'"></section>`,
    );

    expect(result?.content).toBe(
      `<section *transloco="let t; prefix: 'a'; scope: 'lazy-page'; lang: 'es'"></section>`,
    );
  });

  it(`GIVEN the *transloco microsyntax carrying both read and prefix
      WHEN the template is migrated
      THEN the read segment is dropped`, () => {
    const result = migrateTemplate(
      `<div *transloco="let t; read: 'a'; prefix: 'b'"></div>`,
    );

    expect(result?.content).toBe(`<div *transloco="let t; prefix: 'b'"></div>`);
    expect(result?.removed).toBe(1);
    expect(result?.renamed).toBe(0);
  });

  it(`GIVEN a *transloco microsyntax without a read key
      WHEN the template is migrated
      THEN null is returned so the file is not rewritten`, () => {
    expect(
      migrateTemplate(
        `<section *transloco="let t; scope: 'lazy-page'"></section>`,
      ),
    ).toBeNull();
  });

  it(`GIVEN an unrelated attribute whose value contains the word read
      WHEN the template is migrated
      THEN it is left untouched`, () => {
    expect(
      migrateTemplate(`<div *ngIf="hasRead" data-x="read: 'a'"></div>`),
    ).toBeNull();
  });

  it(`GIVEN a microsyntax key that merely starts with read
      WHEN the template is migrated
      THEN it is left untouched`, () => {
    // `readOnly:` maps to a translocoReadOnly input, not translocoRead.
    expect(
      migrateTemplate(`<div *transloco="let t; readOnly: 'a'"></div>`),
    ).toBeNull();
  });

  it(`GIVEN a microsyntax read key with no space after the colon
      WHEN the template is migrated
      THEN it is renamed`, () => {
    expect(
      migrateTemplate(`<div *transloco="let t; read:'a'"></div>`)?.content,
    ).toBe(`<div *transloco="let t; prefix:'a'"></div>`);
  });

  it(`GIVEN a *transloco attribute delimited by single quotes
      WHEN the template is migrated
      THEN the delimiter is preserved`, () => {
    expect(
      migrateTemplate(`<div *transloco='let t; read: "a"'></div>`)?.content,
    ).toBe(`<div *transloco='let t; prefix: "a"'></div>`);
  });

  it(`GIVEN a *transloco attribute spanning several lines
      WHEN the template is migrated
      THEN the read key is still found`, () => {
    const result = migrateTemplate(
      [
        `<ng-container`,
        `  *transloco="let t; scope: 'ds'; lang: 'es'; read: 'nav'"`,
        `>`,
        `</ng-container>`,
      ].join('\n'),
    );

    expect(result?.content).toContain(
      `*transloco="let t; scope: 'ds'; lang: 'es'; prefix: 'nav'"`,
    );
    expect(result?.renamed).toBe(1);
  });

  it(`GIVEN an attribute value containing a greater-than sign
      WHEN the template is migrated
      THEN the tag boundary is respected`, () => {
    const result = migrateTemplate(
      `<ng-template transloco [translocoRead]="a > b ? 'x' : 'y'"></ng-template>`,
    );

    expect(result?.content).toBe(
      `<ng-template transloco [translocoPrefix]="a > b ? 'x' : 'y'"></ng-template>`,
    );
  });

  it(`GIVEN an attribute whose name merely starts with translocoRead
      WHEN the template is migrated
      THEN it is left untouched`, () => {
    expect(migrateTemplate(`<div translocoReadonly="x"></div>`)).toBeNull();
  });

  it(`GIVEN a template without translocoRead
      WHEN the template is migrated
      THEN null is returned so the file is not rewritten`, () => {
    expect(migrateTemplate(`<div translocoPrefix="a"></div>`)).toBeNull();
  });

  it(`GIVEN microsyntax separated by commas
      WHEN the template is migrated
      THEN the read key is still renamed`, () => {
    // Angular's microsyntax accepts `,` wherever it accepts `;`.
    expect(
      migrateTemplate(`<div *transloco="let t, read: 'a', lang: 'es'"></div>`)
        ?.content,
    ).toBe(`<div *transloco="let t, prefix: 'a', lang: 'es'"></div>`);
  });

  it(`GIVEN comma-separated microsyntax carrying both read and prefix
      WHEN the template is migrated
      THEN the read segment is dropped with its separator`, () => {
    expect(
      migrateTemplate(`<div *transloco="let t, read: 'a', prefix: 'b'"></div>`)
        ?.content,
    ).toBe(`<div *transloco="let t, prefix: 'b'"></div>`);
  });

  it(`GIVEN a read value containing a semicolon
      WHEN the template is migrated
      THEN the quoted value survives the rename`, () => {
    expect(
      migrateTemplate(`<div *transloco="let t; read: 'a;b'; lang: 'es'"></div>`)
        ?.content,
    ).toBe(`<div *transloco="let t; prefix: 'a;b'; lang: 'es'"></div>`);
  });

  it(`GIVEN a read value containing a semicolon alongside a prefix
      WHEN the template is migrated
      THEN the whole read segment is dropped, not a slice of it`, () => {
    expect(
      migrateTemplate(
        `<div *transloco="let t; read: 'a;b'; prefix: 'c'"></div>`,
      )?.content,
    ).toBe(`<div *transloco="let t; prefix: 'c'"></div>`);
  });

  it(`GIVEN a read expression containing a semicolon and the word prefix
      WHEN the template is migrated
      THEN the expression is left intact`, () => {
    expect(
      migrateTemplate(
        `<div *transloco="let t; read: format('; prefix:')"></div>`,
      )?.content,
    ).toBe(`<div *transloco="let t; prefix: format('; prefix:')"></div>`);
  });

  it(`GIVEN the read key sitting last in the microsyntax
      WHEN the template is migrated
      THEN no dangling separator is left behind`, () => {
    expect(
      migrateTemplate(`<div *transloco="let t; prefix: 'b'; read: 'a'"></div>`)
        ?.content,
    ).toBe(`<div *transloco="let t; prefix: 'b'"></div>`);
  });

  it(`GIVEN an unrelated attribute whose value contains the word translocoRead
      WHEN the template is migrated
      THEN the value is left untouched`, () => {
    expect(migrateTemplate(`<div title="foo translocoRead bar"></div>`)).toBe(
      null,
    );
  });

  it(`GIVEN a binding expression referencing a variable named translocoRead
      WHEN the template is migrated
      THEN the expression is left untouched`, () => {
    expect(
      migrateTemplate(`<my-cmp [label]="translocoRead + suffix"></my-cmp>`),
    ).toBeNull();
  });

  it(`GIVEN an attribute value mentioning translocoPrefix next to a real read
      WHEN the template is migrated
      THEN the read is renamed rather than silently deleted`, () => {
    // The value is not a prefix binding, so nothing suppresses the rename.
    expect(
      migrateTemplate(
        `<div data-doc="use translocoPrefix= instead" translocoRead="a"></div>`,
      )?.content,
    ).toBe(
      `<div data-doc="use translocoPrefix= instead" translocoPrefix="a"></div>`,
    );
  });

  it(`GIVEN the canonical bind- attribute form
      WHEN the template is migrated
      THEN only the input name is rewritten`, () => {
    expect(
      migrateTemplate(
        `<ng-template transloco bind-translocoRead="a"></ng-template>`,
      )?.content,
    ).toBe(`<ng-template transloco bind-translocoPrefix="a"></ng-template>`);
  });

  it(`GIVEN a valueless translocoRead attribute
      WHEN the template is migrated
      THEN it is renamed`, () => {
    expect(
      migrateTemplate(`<ng-template transloco translocoRead></ng-template>`)
        ?.content,
    ).toBe(`<ng-template transloco translocoPrefix></ng-template>`);
  });

  it(`GIVEN a self-closing element
      WHEN the template is migrated
      THEN it is renamed`, () => {
    expect(
      migrateTemplate(`<ng-template transloco translocoRead="a" />`)?.content,
    ).toBe(`<ng-template transloco translocoPrefix="a" />`);
  });

  it(`GIVEN both inputs bound on one element
      WHEN the template is migrated
      THEN only the prefix binding survives`, () => {
    expect(
      migrateTemplate(
        `<ng-template transloco [translocoRead]="a" [translocoPrefix]="b"></ng-template>`,
      )?.content,
    ).toBe(`<ng-template transloco [translocoPrefix]="b"></ng-template>`);
  });

  it(`GIVEN an empty static prefix next to a read
      WHEN the template is migrated
      THEN the read wins, as it did in v8`, () => {
    // v8 resolved `this.prefix || this.inlineRead`, so an empty prefix fell
    // through to the read rather than suppressing it.
    const result = migrateTemplate(
      `<div translocoPrefix="" translocoRead="root"></div>`,
    );

    expect(result?.content).toBe(`<div translocoPrefix="root"></div>`);
    expect(result?.renamed).toBe(1);
    expect(result?.ambiguous).toBe(0);
  });

  it(`GIVEN an empty prefix key in the microsyntax
      WHEN the template is migrated
      THEN the read wins, as it did in v8`, () => {
    expect(
      migrateTemplate(
        `<div *transloco="let t; prefix: ''; read: 'root'"></div>`,
      )?.content,
    ).toBe(`<div *transloco="let t; prefix: 'root'"></div>`);
  });

  it(`GIVEN a prefix bound to an expression next to a read
      WHEN the template is migrated
      THEN the read is dropped and the case is reported as ambiguous`, () => {
    // Only the running app knows whether the expression is empty, so this one
    // cannot be decided statically.
    const result = migrateTemplate(
      `<div [translocoPrefix]="maybeUndefined" translocoRead="fallback"></div>`,
    );

    expect(result?.content).toBe(
      `<div [translocoPrefix]="maybeUndefined"></div>`,
    );
    expect(result?.ambiguous).toBe(1);
  });

  it(`GIVEN a template that cannot be parsed
      WHEN the template is migrated
      THEN it is reported as skipped rather than rewritten`, () => {
    const source = `<div [translocoRead]="a b c ]]]"></div>`;
    const result = migrateTemplate(source);

    expect(result?.content).toBe(source);
    expect(result?.skipped).toBe(1);
    expect(result?.renamed).toBe(0);
  });

  it(`GIVEN an unparseable template with no hint of a read
      WHEN the template is migrated
      THEN it is passed over in silence`, () => {
    expect(
      migrateTemplate(`<div *transloco="let t; ]]]"></div>`)?.skipped ?? 0,
    ).toBe(0);
  });

  it(`GIVEN a read binding inside a control-flow block
      WHEN the template is migrated
      THEN it is still found`, () => {
    expect(
      migrateTemplate(`@if (x) {\n  <p translocoRead="a"></p>\n}`)?.content,
    ).toBe(`@if (x) {\n  <p translocoPrefix="a"></p>\n}`);
  });

  it(`GIVEN a template using CRLF line endings
      WHEN the template is migrated
      THEN the offsets still line up`, () => {
    expect(
      migrateTemplate(`<div>\r\n  <p translocoRead="a"></p>\r\n</div>`)
        ?.content,
    ).toBe(`<div>\r\n  <p translocoPrefix="a"></p>\r\n</div>`);
  });
});

describe('migrateInlineTemplates', () => {
  it(`GIVEN a component with an inline template using translocoRead
      WHEN the source is migrated
      THEN only the template literal is rewritten`, () => {
    const source = [
      `@Component({`,
      '  template: `<ng-template transloco translocoRead="a"></ng-template>`,',
      `})`,
      `export class Foo {`,
      `  readonly label = 'translocoRead';`,
      `}`,
    ].join('\n');

    const result = migrateInlineTemplates(source);

    expect(result?.content).toContain('translocoPrefix="a"');
    expect(result?.content).toContain(`readonly label = 'translocoRead';`);
    expect(result?.renamed).toBe(1);
  });

  it(`GIVEN a template literal containing an interpolated expression
      WHEN the source is migrated
      THEN the literal is still bounded correctly`, () => {
    const source =
      '@Component({ template: `<div translocoRead="a">${cond ? `x` : `y`}</div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div translocoPrefix="a">${cond ? `x` : `y`}</div>` })',
    );
  });

  it(`GIVEN a file mentioning translocoRead outside any template
      WHEN the source is migrated
      THEN nothing is rewritten`, () => {
    const source = `const attr = 'translocoRead';`;

    expect(migrateInlineTemplates(source)?.content ?? source).toBe(source);
  });

  it(`GIVEN an inline template using the *transloco microsyntax
      WHEN the source is migrated
      THEN the read key is renamed`, () => {
    const source =
      '@Component({ template: `<div *transloco="let t; read: \'a\'"></div>` })';

    expect(migrateInlineTemplates(source)?.content).toBe(
      '@Component({ template: `<div *transloco="let t; prefix: \'a\'"></div>` })',
    );
  });

  it(`GIVEN an interpolation containing a brace inside a string
      WHEN the source is migrated
      THEN a later binding is still migrated`, () => {
    // Counting braces in raw text ends the literal at the inner backtick and
    // loses everything after it.
    const source =
      '@Component({ template: `<div>${format("}") ? `a` : `b`}</div><p translocoRead="x"></p>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div>${format("}") ? `a` : `b`}</div><p translocoPrefix="x"></p>` })',
    );
    expect(result?.renamed).toBe(1);
  });

  it(`GIVEN the word template inside an unrelated string
      WHEN the source is migrated
      THEN the string is left untouched`, () => {
    const source = `const note = "template: '<div translocoRead=\\"x\\"></div>'";`;

    expect(migrateInlineTemplates(source)).toBeNull();
  });

  it(`GIVEN the word template inside a comment
      WHEN the source is migrated
      THEN the comment is left untouched`, () => {
    const source = `// template: '<div translocoRead="x"></div>'\nconst a = 1;`;

    expect(migrateInlineTemplates(source)).toBeNull();
  });

  it(`GIVEN a plain object property named template
      WHEN the source is migrated
      THEN only decorator metadata is rewritten`, () => {
    const source = [
      `const config = { template: '<div translocoRead="x"></div>' };`,
      `@Component({ template: '<div translocoRead="y"></div>' })`,
      `export class Foo {}`,
    ].join('\n');

    const result = migrateInlineTemplates(source);

    expect(result?.content).toContain(
      `const config = { template: '<div translocoRead="x"></div>' };`,
    );
    expect(result?.content).toContain(`translocoPrefix="y"`);
    expect(result?.renamed).toBe(1);
  });

  it(`GIVEN a decorator whose earlier template needs no change
      WHEN the source is migrated
      THEN a nested template mention is not rescanned`, () => {
    // The scan used to resume inside a literal it had already examined.
    const source = [
      `@Component({ template: '<p>no read here</p>' })`,
      `export class A {}`,
      `const doc = "template: '<div translocoRead=\\"y\\"></div>'";`,
    ].join('\n');

    expect(migrateInlineTemplates(source)).toBeNull();
  });

  it(`GIVEN an inline template that cannot be parsed
      WHEN the source is migrated
      THEN it is reported as skipped rather than rewritten`, () => {
    const source =
      '@Component({ template: `<div [translocoRead]="a b c ]]]"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(source);
    expect(result?.skipped).toBe(1);
  });

  it(`GIVEN a static prefix written over an interpolation hole
      WHEN the source is migrated
      THEN the dropped read is reported as ambiguous`, () => {
    // Masking blanks the hole, so the prefix parses as whitespace - non-empty,
    // and so indistinguishable from a real static value without this check.
    const source =
      '@Component({ template: `<div translocoPrefix="${p}" translocoRead="fallback"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div translocoPrefix="${p}"></div>` })',
    );
    expect(result?.removed).toBe(1);
    expect(result?.ambiguous).toBe(1);
  });

  it(`GIVEN a bound prefix written over an interpolation hole
      WHEN the source is migrated
      THEN the prefix survives and the read is reported as ambiguous`, () => {
    // The masked expression is empty, which would otherwise read as "no prefix"
    // and take the live binding down with the read it was renaming.
    const source =
      '@Component({ template: `<div [translocoPrefix]="${p}" translocoRead="fallback"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div [translocoPrefix]="${p}"></div>` })',
    );
    expect(result?.renamed).toBe(0);
    expect(result?.removed).toBe(1);
    expect(result?.ambiguous).toBe(1);
  });

  it(`GIVEN an interpolation hole away from the prefix
      WHEN the source is migrated
      THEN the static prefix is still decided without a warning`, () => {
    const source =
      '@Component({ template: `<div translocoPrefix="admin" translocoRead="fallback">${body}</div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div translocoPrefix="admin">${body}</div>` })',
    );
    expect(result?.removed).toBe(1);
    expect(result?.ambiguous).toBe(0);
  });

  it(`GIVEN a microsyntax prefix written over an interpolation hole
      WHEN the source is migrated
      THEN the prefix survives and the read is reported as ambiguous`, () => {
    // The microsyntax drops a blank value out of the binding's span, so this
    // prefix reports the same span as a bare `prefix` - and removing it as an
    // empty key used to leave the `: ${p}` behind it dangling.
    const source =
      '@Component({ template: `<div *transloco="let t; read: \'x\'; prefix: ${p}"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div *transloco="let t; prefix: ${p}"></div>` })',
    );
    expect(result?.renamed).toBe(0);
    expect(result?.removed).toBe(1);
    expect(result?.ambiguous).toBe(1);
  });

  it(`GIVEN a microsyntax hole ahead of the read
      WHEN the source is migrated
      THEN it is reported as skipped rather than rewritten`, () => {
    // Masking leaves `prefix:  ; read`, which the expression parser rejects -
    // so this one never reaches the classifier at all.
    const source =
      '@Component({ template: `<div *transloco="let t; prefix: ${p}; read: \'x\'"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(source);
    expect(result?.skipped).toBe(1);
  });

  it(`GIVEN a read written over an interpolation hole with no prefix beside it
      WHEN the source is migrated
      THEN it is renamed as usual`, () => {
    // Only the prefix decides the fallback, so a masked read is unaffected.
    const source =
      '@Component({ template: `<div translocoRead="${r}"></div>` })';

    const result = migrateInlineTemplates(source);

    expect(result?.content).toBe(
      '@Component({ template: `<div translocoPrefix="${r}"></div>` })',
    );
    expect(result?.renamed).toBe(1);
    expect(result?.ambiguous).toBe(0);
  });
});

describe('usesGlobalTranslateFn', () => {
  it(`GIVEN a file importing translate from @jsverse/transloco
      WHEN it is inspected
      THEN it reports usage`, () => {
    expect(
      usesGlobalTranslateFn(`import { translate } from '@jsverse/transloco';`),
    ).toBe(true);
  });

  it(`GIVEN a file importing translateObject under an alias
      WHEN it is inspected
      THEN it reports usage`, () => {
    expect(
      usesGlobalTranslateFn(
        `import { translateObject as t } from '@jsverse/transloco';`,
      ),
    ).toBe(true);
  });

  it(`GIVEN a locally defined translate helper
      WHEN it is inspected
      THEN it does not report usage`, () => {
    expect(
      usesGlobalTranslateFn(
        [
          `import { TranslocoService } from '@jsverse/transloco';`,
          `function translate(key: string) { return key; }`,
        ].join('\n'),
      ),
    ).toBe(false);
  });

  it(`GIVEN a type-only import of translate
      WHEN it is inspected
      THEN it does not report usage`, () => {
    // Erased before the app runs, so no provider is needed - this is what
    // keeps the documented SSR/MFE opt-out working.
    expect(
      usesGlobalTranslateFn(
        `import type { translate } from '@jsverse/transloco';`,
      ),
    ).toBe(false);
  });

  it(`GIVEN an inline type specifier for translate
      WHEN it is inspected
      THEN it does not report usage`, () => {
    expect(
      usesGlobalTranslateFn(
        `import { type translate, TranslocoService } from '@jsverse/transloco';`,
      ),
    ).toBe(false);
  });

  it(`GIVEN a namespace import whose translate is called
      WHEN it is inspected
      THEN it reports usage`, () => {
    expect(
      usesGlobalTranslateFn(
        [
          `import * as transloco from '@jsverse/transloco';`,
          `export const greet = () => transloco.translate('hello');`,
        ].join('\n'),
      ),
    ).toBe(true);
  });

  it(`GIVEN a namespace import that never calls the global functions
      WHEN it is inspected
      THEN it does not report usage`, () => {
    expect(
      usesGlobalTranslateFn(
        [
          `import * as transloco from '@jsverse/transloco';`,
          `export const service = transloco.TranslocoService;`,
        ].join('\n'),
      ),
    ).toBe(false);
  });

  it(`GIVEN translate imported from another package
      WHEN it is inspected
      THEN it does not report usage`, () => {
    expect(
      usesGlobalTranslateFn(`import { translate } from 'other-package';`),
    ).toBe(false);
  });
});

describe('providesGlobalTranslateFn', () => {
  it(`GIVEN a file calling the provider
      WHEN it is inspected
      THEN it reports the project as wired`, () => {
    expect(
      providesGlobalTranslateFn(
        `export const providers = [provideGlobalTranslateFn()];`,
      ),
    ).toBe(true);
  });

  it(`GIVEN the provider named only in a comment
      WHEN it is inspected
      THEN it does not report the project as wired`, () => {
    // A mention must not make the migration believe the app is already set up
    // and skip it - that would leave translate() returning ''.
    expect(
      providesGlobalTranslateFn(
        `// remember to add provideGlobalTranslateFn() one day\nexport const x = 1;`,
      ),
    ).toBe(false);
  });

  it(`GIVEN the provider named only in a string
      WHEN it is inspected
      THEN it does not report the project as wired`, () => {
    expect(
      providesGlobalTranslateFn(`const doc = 'provideGlobalTranslateFn()';`),
    ).toBe(false);
  });

  it(`GIVEN the provider imported but never called
      WHEN it is inspected
      THEN it does not report the project as wired`, () => {
    expect(
      providesGlobalTranslateFn(
        `import { provideGlobalTranslateFn } from '@jsverse/transloco';`,
      ),
    ).toBe(false);
  });
});

describe('migration-v9', () => {
  const schematicRunner = new SchematicTestRunner('migrations', collectionPath);

  async function run(setup: (tree: UnitTestTree) => void) {
    const tree = await createWorkspace(schematicRunner);
    setup(tree);

    return schematicRunner.runSchematic('migration-v9', {}, tree);
  }

  it(`GIVEN a workspace with a template using translocoRead
      WHEN the migration runs
      THEN the template is rewritten in place`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/feature.html',
        `<ng-template transloco let-t translocoRead="home"></ng-template>`,
      ),
    );

    expect(tree.readContent('/projects/bar/src/app/feature.html')).toBe(
      `<ng-template transloco let-t translocoPrefix="home"></ng-template>`,
    );
  });

  it(`GIVEN an application importing translate()
      WHEN the migration runs
      THEN provideGlobalTranslateFn() is added to its providers`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/greeter.ts',
        [
          `import { translate } from '@jsverse/transloco';`,
          `export const greet = () => translate('hello');`,
        ].join('\n'),
      ),
    );

    const config = tree
      .readContent('/projects/bar/src/app/app.config.ts')
      .replace(/\s+/g, ' ');

    expect(config).toContain('provideGlobalTranslateFn()');
    expect(config).toContain('@jsverse/transloco');
  });

  it(`GIVEN an application that does not use the standalone functions
      WHEN the migration runs
      THEN no provider is added`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/greeter.ts',
        [
          `import { TranslocoService } from '@jsverse/transloco';`,
          `export const service = TranslocoService;`,
        ].join('\n'),
      ),
    );

    expect(
      tree.readContent('/projects/bar/src/app/app.config.ts'),
    ).not.toContain('provideGlobalTranslateFn');
  });

  it(`GIVEN an application that already registers the provider in its config
      WHEN the migration runs
      THEN the provider is not added a second time`, async () => {
    // `addRootProvider` inserts unconditionally, so a second call here would
    // really produce two of them.
    const tree = await run((host) => {
      host.create(
        '/projects/bar/src/app/greeter.ts',
        [
          `import { translate } from '@jsverse/transloco';`,
          `export const greet = () => translate('hello');`,
        ].join('\n'),
      );
      host.overwrite(
        '/projects/bar/src/app/app.config.ts',
        [
          `import { ApplicationConfig } from '@angular/core';`,
          `import { provideGlobalTranslateFn } from '@jsverse/transloco';`,
          `export const appConfig: ApplicationConfig = {`,
          `  providers: [provideGlobalTranslateFn()],`,
          `};`,
        ].join('\n'),
      );
    });

    const occurrences = tree
      .readContent('/projects/bar/src/app/app.config.ts')
      .match(/provideGlobalTranslateFn\(\)/g);

    expect(occurrences).toHaveLength(1);
  });

  it(`GIVEN an application that only mentions the provider in a comment
      WHEN the migration runs
      THEN the provider is still added to the config`, async () => {
    // The old substring guard treated any mention as "already wired", which
    // silently left such applications without a provider.
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/greeter.ts',
        [
          `import { translate } from '@jsverse/transloco';`,
          `// TODO: call provideGlobalTranslateFn() at some point`,
          `export const greet = () => translate('hello');`,
        ].join('\n'),
      ),
    );

    expect(tree.readContent('/projects/bar/src/app/app.config.ts')).toContain(
      'provideGlobalTranslateFn()',
    );
  });
});

describe('migration-v9 without a workspace file', () => {
  // Nx serves a virtual angular.json through its CLI adapter, so the normal
  // path covers `nx migrate`. This is the case where there is no workspace at
  // all - a bare library, or an Nx repo without the Angular plugin.
  const schematicRunner = new SchematicTestRunner('migrations', collectionPath);

  function createBareTree() {
    const tree = new UnitTestTree(new HostTree());
    tree.create('/package.json', JSON.stringify({ name: 'bare' }));

    return tree;
  }

  it(`GIVEN no angular.json
      WHEN a template uses translocoRead
      THEN it is still migrated`, async () => {
    const tree = createBareTree();
    tree.create(
      '/src/app.html',
      `<ng-container *transloco="let t; read: 'home'"></ng-container>`,
    );

    const result = await schematicRunner.runSchematic('migration-v9', {}, tree);

    expect(result.readContent('/src/app.html')).toBe(
      `<ng-container *transloco="let t; prefix: 'home'"></ng-container>`,
    );
  });

  it(`GIVEN no angular.json
      WHEN a file uses the standalone translate functions
      THEN the migration names it instead of skipping silently`, async () => {
    const tree = createBareTree();
    tree.create(
      '/src/greeter.ts',
      [
        `import { translate } from '@jsverse/transloco';`,
        `export const greet = () => translate('hello');`,
      ].join('\n'),
    );

    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    await schematicRunner.runSchematic('migration-v9', {}, tree);

    const reported = warnings.join('\n');
    expect(reported).toContain('provideGlobalTranslateFn');
    expect(reported).toContain('/src/greeter.ts');
  });
});
