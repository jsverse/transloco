import { readFileSync } from 'node:fs';
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
import { migrateMarkerImportSource } from './marker-import';
import { referencesScopedLibsWebpackPlugin } from './scoped-libs-webpack-plugin';
import {
  findStrippingError,
  migrateConfigTypeImportSource,
  referencesConfigPackage,
} from './config-type-import';
import { findVersionFloorWarnings } from './report-version-floors';
import { findScripts } from './cli-scripts';

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

describe('migrateMarkerImportSource', () => {
  it(`GIVEN marker imported alone from the top-level package
      WHEN the source is migrated
      THEN the specifier is repointed to the CLI's marker subpath`, () => {
    const result = migrateMarkerImportSource(
      `import { marker } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      `import { marker } from '@jsverse/transloco-cli/marker';`,
    );
    expect(result?.migrated).toBe(1);
  });

  it(`GIVEN marker imported under an alias
      WHEN the source is migrated
      THEN the alias is preserved on the new specifier`, () => {
    const result = migrateMarkerImportSource(
      `import { marker as mark } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      `import { marker as mark } from '@jsverse/transloco-cli/marker';`,
    );
  });

  it(`GIVEN double-quoted marker import
      WHEN the source is migrated
      THEN the new specifier keeps the same quote style`, () => {
    const result = migrateMarkerImportSource(
      `import { marker } from "@jsverse/transloco-keys-manager";`,
    );

    expect(result?.content).toBe(
      `import { marker } from "@jsverse/transloco-cli/marker";`,
    );
  });

  it(`GIVEN marker imported alongside another named export
      WHEN the source is migrated
      THEN marker moves to its own import from the CLI and the rest is left in place`, () => {
    const result = migrateMarkerImportSource(
      `import { TranslocoExtractKeysWebpackPlugin, marker } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      [
        `import { TranslocoExtractKeysWebpackPlugin } from '@jsverse/transloco-keys-manager';`,
        `import { marker } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(1);
  });

  it(`GIVEN marker imported from the old /marker subpath
      WHEN the source is migrated
      THEN the specifier is repointed to the CLI's marker subpath`, () => {
    const result = migrateMarkerImportSource(
      `import { marker } from '@jsverse/transloco-keys-manager/marker';`,
    );

    expect(result?.content).toBe(
      `import { marker } from '@jsverse/transloco-cli/marker';`,
    );
    expect(result?.migrated).toBe(1);
    expect(result?.introduced).toBe(1);
  });

  it(`GIVEN marker already imported from the CLI's marker subpath
      WHEN the source is migrated
      THEN nothing changes`, () => {
    expect(
      migrateMarkerImportSource(
        `import { marker } from '@jsverse/transloco-cli/marker';`,
      ),
    ).toBeNull();
  });

  it(`GIVEN a type-only marker import
      WHEN the source is migrated
      THEN it is repointed, since the package root no longer resolves`, () => {
    const result = migrateMarkerImportSource(
      `import type { marker } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      `import type { marker } from '@jsverse/transloco-cli/marker';`,
    );
  });

  it(`GIVEN a type-only import mixing marker with another name
      WHEN the source is migrated
      THEN the new marker import stays type-only`, () => {
    const result = migrateMarkerImportSource(
      `import type { Other, marker } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      [
        `import type { Other } from '@jsverse/transloco-keys-manager';`,
        `import type { marker } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
  });

  it(`GIVEN marker imported with an inline type modifier
      WHEN the source is migrated
      THEN the modifier is kept on the moved import`, () => {
    const result = migrateMarkerImportSource(
      `import { Other, type marker as mark } from '@jsverse/transloco-keys-manager';`,
    );

    expect(result?.content).toBe(
      [
        `import { Other } from '@jsverse/transloco-keys-manager';`,
        `import { type marker as mark } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
  });

  it(`GIVEN a file that never imports marker
      WHEN the source is migrated
      THEN nothing changes`, () => {
    expect(
      migrateMarkerImportSource(
        `import { TranslocoExtractKeysWebpackPlugin } from '@jsverse/transloco-keys-manager';`,
      ),
    ).toBeNull();
  });

  it.each([
    [
      'the old /marker subpath, aliased',
      `import { marker as mark } from '@jsverse/transloco-keys-manager/marker';`,
      `import { marker as mark } from '@jsverse/transloco-cli/marker';`,
    ],
    [
      'the old /marker subpath, type-only',
      `import type { marker } from '@jsverse/transloco-keys-manager/marker';`,
      `import type { marker } from '@jsverse/transloco-cli/marker';`,
    ],
    [
      'the old /marker subpath, double-quoted without a semicolon',
      `import { marker } from "@jsverse/transloco-keys-manager/marker"`,
      `import { marker } from "@jsverse/transloco-cli/marker"`,
    ],
    [
      'the old /marker subpath, with an inline type modifier',
      `import { type marker } from '@jsverse/transloco-keys-manager/marker';`,
      `import { type marker } from '@jsverse/transloco-cli/marker';`,
    ],
  ])(
    `GIVEN marker imported from %s
      WHEN the source is migrated
      THEN only the specifier changes`,
    (_, source, expected) => {
      expect(migrateMarkerImportSource(source)?.content).toBe(expected);
    },
  );

  it(`GIVEN imports of marker from both old paths
      WHEN the source is migrated
      THEN both are repointed and counted`, () => {
    const result = migrateMarkerImportSource(
      [
        `import { marker } from '@jsverse/transloco-keys-manager/marker';`,
        `import { marker as mark } from '@jsverse/transloco-keys-manager';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { marker as mark } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(2);
  });

  it.each(['\n', '\r\n'])(
    `GIVEN marker imported next to another name in a file with line ending %j
      WHEN the source is migrated
      THEN the new import is joined with the same line ending`,
    (eol) => {
      const result = migrateMarkerImportSource(
        `import { Other, marker } from '@jsverse/transloco-keys-manager';${eol}const a = 1;${eol}`,
      );

      expect(result?.content).toBe(
        [
          `import { Other } from '@jsverse/transloco-keys-manager';`,
          `import { marker } from '@jsverse/transloco-cli/marker';`,
          `const a = 1;`,
          ``,
        ].join(eol),
      );
    },
  );

  it(`GIVEN a file with a BOM and CRLF line endings
      WHEN the source is migrated
      THEN the BOM and the line endings are kept`, () => {
    const source = `\uFEFFimport { marker } from '@jsverse/transloco-keys-manager/marker';\r\nconst a = 1;\r\n`;

    expect(migrateMarkerImportSource(source)?.content).toBe(
      `\uFEFFimport { marker } from '@jsverse/transloco-cli/marker';\r\nconst a = 1;\r\n`,
    );
  });

  it(`GIVEN a BOM and CRLF with marker next to another name
      WHEN the source is migrated
      THEN the BOM is not taken for indentation and the split keeps CRLF`, () => {
    const source = `\uFEFFimport { Other, marker } from '@jsverse/transloco-keys-manager';\r\nconst a = 1;\r\n`;

    expect(migrateMarkerImportSource(source)?.content).toBe(
      `\uFEFFimport { Other } from '@jsverse/transloco-keys-manager';\r\nimport { marker } from '@jsverse/transloco-cli/marker';\r\nconst a = 1;\r\n`,
    );
  });

  it(`GIVEN marker already imported from the CLI and again from an old path
      WHEN the source is migrated
      THEN the old import goes without a second import of the CLI and nothing is introduced`, () => {
    const result = migrateMarkerImportSource(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { marker } from '@jsverse/transloco-keys-manager/marker';`,
        `export const key = marker('a');`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `export const key = marker('a');`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(1);
    expect(result?.introduced).toBe(0);
  });

  it(`GIVEN marker already imported from the CLI and an aliased marker next to another name on an old import
      WHEN the source is migrated
      THEN the alias moves to its own import from the CLI`, () => {
    const result = migrateMarkerImportSource(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { Other, marker as again } from '@jsverse/transloco-keys-manager';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { Other } from '@jsverse/transloco-keys-manager';`,
        `import { marker as again } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
  });

  it(`GIVEN an aliased marker and the CLI's marker already imported
      WHEN the source is migrated
      THEN the alias is still imported from the CLI`, () => {
    const result = migrateMarkerImportSource(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { marker as mark } from '@jsverse/transloco-keys-manager/marker';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { marker } from '@jsverse/transloco-cli/marker';`,
        `import { marker as mark } from '@jsverse/transloco-cli/marker';`,
      ].join('\n'),
    );
  });

  it(`GIVEN a first line holding an old import that marker leaves empty, after a BOM
      WHEN the source is migrated
      THEN the line goes and the BOM stays`, () => {
    const result = migrateMarkerImportSource(
      `\uFEFFimport { marker } from '@jsverse/transloco-keys-manager/marker';\r\nimport { marker } from '@jsverse/transloco-cli/marker';\r\n`,
    );

    expect(result?.content).toBe(
      `\uFEFFimport { marker } from '@jsverse/transloco-cli/marker';\r\n`,
    );
  });

  it.each([
    [`import * as km from '@jsverse/transloco-keys-manager/marker';`],
    [`import km from '@jsverse/transloco-keys-manager/marker';`],
    [`import km, { marker } from '@jsverse/transloco-keys-manager/marker';`],
    [`import '@jsverse/transloco-keys-manager/marker';`],
    [`const { marker } = require('@jsverse/transloco-keys-manager/marker');`],
    [`const km = await import('@jsverse/transloco-keys-manager/marker');`],
    [`export { marker } from '@jsverse/transloco-keys-manager/marker';`],
    [`export * from '@jsverse/transloco-keys-manager/marker';`],
  ])(
    `GIVEN %s
      WHEN the source is migrated
      THEN nothing changes`,
    (source) => {
      expect(migrateMarkerImportSource(source)).toBeNull();
    },
  );

  it(`GIVEN a .tsx file importing marker from an old path
      WHEN the source is migrated as that file
      THEN the import is repointed`, () => {
    const source = [
      `import { marker } from '@jsverse/transloco-keys-manager/marker';`,
      `export const view = <p>{marker('a')}</p>;`,
    ].join('\n');

    expect(migrateMarkerImportSource(source, 'view.tsx')?.content).toBe(
      source.replace('transloco-keys-manager', 'transloco-cli'),
    );
  });

  it(`GIVEN the output of a migration
      WHEN it is migrated again
      THEN nothing changes`, () => {
    const first = migrateMarkerImportSource(
      `import { Other, marker } from '@jsverse/transloco-keys-manager';`,
    )?.content;

    expect(first).toBeDefined();
    expect(migrateMarkerImportSource(first as string)).toBeNull();
  });
});

describe('referencesScopedLibsWebpackPlugin', () => {
  it.each([
    `const Plugin = require('@jsverse/transloco-scoped-libs/webpack');`,
    `const Plugin = require('@jsverse/transloco-scoped-libs/webpack.plugin');`,
    `const Plugin = require("@jsverse/transloco-scoped-libs/webpack.js");`,
    `const Plugin = require('@jsverse/transloco-scoped-libs/webpack.plugin.js');`,
    `import Plugin from '@jsverse/transloco-scoped-libs/webpack';`,
    `import Plugin from "@jsverse/transloco-scoped-libs/webpack.plugin";`,
    `import Plugin from '@jsverse/transloco-scoped-libs/webpack.js';`,
    `import Plugin from '@jsverse/transloco-scoped-libs/webpack.plugin.js';`,
    `const Plugin = await import('@jsverse/transloco-scoped-libs/webpack.plugin.js');`,
    `module.exports = { plugins: [new TranslocoScopedLibsWebpackPlugin()] };`,
  ])(
    `GIVEN %s
      WHEN it is checked
      THEN it counts as a reference to the removed plugin`,
    (source) => {
      expect(referencesScopedLibsWebpackPlugin(source)).toBe(true);
    },
  );

  it.each([
    `import run from '@jsverse/transloco-scoped-libs';`,
    `const run = require('@jsverse/transloco-scoped-libs');`,
    `const { version } = require('@jsverse/transloco-scoped-libs/package.json');`,
    `const { TranslocoExtractKeysWebpackPlugin } = require('@jsverse/transloco-keys-manager');`,
    `module.exports = { plugins: [] };`,
  ])(
    `GIVEN %s
      WHEN it is checked
      THEN it does not count as a reference to the removed plugin`,
    (source) => {
      expect(referencesScopedLibsWebpackPlugin(source)).toBe(false);
    },
  );
});

describe('migrateConfigTypeImportSource', () => {
  it(`GIVEN the config v8's schematics generated
      WHEN it is migrated
      THEN the TranslocoGlobalConfig import moves to @jsverse/transloco as type-only`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';`,
        ``,
        `const config: TranslocoGlobalConfig = { langs: ['en'] };`,
        ``,
        `export default config;`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import type {TranslocoGlobalConfig} from '@jsverse/transloco';`,
        ``,
        `const config: TranslocoGlobalConfig = { langs: ['en'] };`,
        ``,
        `export default config;`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(1);
    expect(result?.readers).toBe(0);
  });

  it(`GIVEN a script importing getGlobalConfig
      WHEN it is migrated
      THEN the import moves to @jsverse/transloco-cli`, () => {
    const result = migrateConfigTypeImportSource(
      `import { getGlobalConfig } from '@jsverse/transloco-utils';\nconst config = getGlobalConfig();`,
    );

    expect(result?.content).toBe(
      `import { getGlobalConfig } from '@jsverse/transloco-cli';\nconst config = getGlobalConfig();`,
    );
    expect(result?.migrated).toBe(1);
    expect(result?.readers).toBe(1);
  });

  it(`GIVEN one import holding the reader and the type
      WHEN it is migrated
      THEN it is split in two, keeping the alias, the quotes and the missing semicolon`, () => {
    const result = migrateConfigTypeImportSource(
      `import { getGlobalConfig, TranslocoGlobalConfig as Config } from "@jsverse/transloco-utils"`,
    );

    expect(result?.content).toBe(
      [
        `import type { TranslocoGlobalConfig as Config } from "@jsverse/transloco"`,
        `import { getGlobalConfig } from "@jsverse/transloco-cli"`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(2);
    expect(result?.readers).toBe(1);
  });

  it(`GIVEN an aliased getGlobalConfig
      WHEN it is migrated
      THEN the alias is kept`, () => {
    const result = migrateConfigTypeImportSource(
      `import { getGlobalConfig as readConfig } from '@jsverse/transloco-utils';`,
    );

    expect(result?.content).toBe(
      `import { getGlobalConfig as readConfig } from '@jsverse/transloco-cli';`,
    );
  });

  it(`GIVEN an indented import holding both
      WHEN it is migrated
      THEN the added import is indented the same`, () => {
    const result = migrateConfigTypeImportSource(
      `  import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
    );

    expect(result?.content).toBe(
      [
        `  import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `  import { getGlobalConfig } from '@jsverse/transloco-cli';`,
      ].join('\n'),
    );
  });

  it.each([
    [
      `import type { TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
      `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
    ],
    [
      `import { type TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
      `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
    ],
    [
      `import type { getGlobalConfig } from '@jsverse/transloco-utils';`,
      `import type { getGlobalConfig } from '@jsverse/transloco-cli';`,
    ],
    [
      `import { type getGlobalConfig } from '@jsverse/transloco-utils';`,
      `import { type getGlobalConfig } from '@jsverse/transloco-cli';`,
    ],
  ])(
    `GIVEN %s
      WHEN it is migrated
      THEN the type modifier is kept where the binding needs it`,
    (source, expected) => {
      expect(migrateConfigTypeImportSource(source)?.content).toBe(expected);
    },
  );

  it(`GIVEN an import with a name that has no new home
      WHEN it is migrated
      THEN that name stays on the utils import`, () => {
    const result = migrateConfigTypeImportSource(
      `import { type Foo, TranslocoGlobalConfig, getGlobalConfig } from '@jsverse/transloco-utils';`,
    );

    expect(result?.content).toBe(
      [
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `import { type Foo } from '@jsverse/transloco-utils';`,
      ].join('\n'),
    );
  });

  it(`GIVEN comments around the import
      WHEN it is migrated
      THEN they are left in place`, () => {
    const result = migrateConfigTypeImportSource(
      `// The config\nimport { TranslocoGlobalConfig } from '@jsverse/transloco-utils'; // type\nexport default {} as TranslocoGlobalConfig;`,
    );

    expect(result?.content).toBe(
      `// The config\nimport type { TranslocoGlobalConfig } from '@jsverse/transloco'; // type\nexport default {} as TranslocoGlobalConfig;`,
    );
  });

  it.each([
    `import * as utils from '@jsverse/transloco-utils';`,
    `import utils from '@jsverse/transloco-utils';`,
    `import utils, { TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
    `import { somethingElse } from '@jsverse/transloco-utils';`,
    `import '@jsverse/transloco-utils';`,
    `const { getGlobalConfig } = require('@jsverse/transloco-utils');`,
    `const utils = await import('@jsverse/transloco-utils');`,
    `import utils = require('@jsverse/transloco-utils');`,
    `export { getGlobalConfig } from '@jsverse/transloco-utils';`,
    `/** @type {import('@jsverse/transloco-utils').TranslocoGlobalConfig} */\nexport default {};`,
    `type Config = import('@jsverse/transloco-utils').TranslocoGlobalConfig;`,
  ])(
    `GIVEN %s
      WHEN it is migrated
      THEN it is left alone and still reported as a reference`,
    (source) => {
      expect(migrateConfigTypeImportSource(source)).toBeNull();
      expect(referencesConfigPackage(source)).toBe(true);
    },
  );

  it.each([
    `import { TranslocoGlobalConfig } from './local-types';`,
    `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
    `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
    `import { getGlobalConfig } from '@jsverse/transloco-utils-extra';`,
    `// import { getGlobalConfig } from '@jsverse/transloco-utils';`,
    `/** @type {import('@jsverse/transloco-utils-extra').Config} */\nexport default {};`,
    `const utils = require('@jsverse/transloco-utils-extra');`,
  ])(
    `GIVEN %s
      WHEN it is migrated
      THEN it is left alone and not reported`,
    (source) => {
      expect(migrateConfigTypeImportSource(source)).toBeNull();
      expect(referencesConfigPackage(source)).toBe(false);
    },
  );

  it(`GIVEN a CRLF file with an import holding both
      WHEN it is split
      THEN every line break of the file is a CRLF`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
        `export default {} as TranslocoGlobalConfig;`,
        ``,
      ].join('\r\n'),
    );

    expect(result?.content).toBe(
      [
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `export default {} as TranslocoGlobalConfig;`,
        ``,
      ].join('\r\n'),
    );
    expect(result?.content).not.toMatch(/(?<!\r)\n/);
  });

  it(`GIVEN a CRLF file whose last line is the import
      WHEN it is split
      THEN the added line break is a CRLF`, () => {
    const result = migrateConfigTypeImportSource(
      `// config\r\nimport { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
    );

    expect(result?.content).not.toMatch(/(?<!\r)\n/);
    expect(result?.content.split('\r\n')).toHaveLength(3);
  });

  it(`GIVEN a file starting with a BOM
      WHEN its first import is split
      THEN the BOM stays once, at offset 0`, () => {
    const result = migrateConfigTypeImportSource(
      `\uFEFFimport { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';\nexport default {} as TranslocoGlobalConfig;`,
    );

    expect(result?.content).toBe(
      [
        `\uFEFFimport type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `export default {} as TranslocoGlobalConfig;`,
      ].join('\n'),
    );
    expect(result?.content.split('\uFEFF')).toHaveLength(2);
    expect(result?.content.indexOf('\uFEFF')).toBe(0);
  });

  it(`GIVEN a file that already imports the type from @jsverse/transloco
      WHEN the utils import is migrated
      THEN the name only leaves the utils import`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
      ].join('\n'),
    );
    expect(result?.migrated).toBe(2);
  });

  it(`GIVEN a file that already imports getGlobalConfig from the CLI
      WHEN the utils import is migrated
      THEN the name only leaves the utils import`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
      ].join('\n'),
    );
  });

  it(`GIVEN a utils import whose names are all imported already
      WHEN it is migrated
      THEN the whole import line is removed`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `  import { getGlobalConfig } from '@jsverse/transloco-utils';`,
        `run(getGlobalConfig());`,
      ].join('\r\n'),
    );

    expect(result?.content).toBe(
      [
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
        `run(getGlobalConfig());`,
      ].join('\r\n'),
    );
  });

  it(`GIVEN a file importing other names from the new packages
      WHEN the utils import is migrated
      THEN a separate import is added and the existing ones are left alone`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import { provideTransloco } from '@jsverse/transloco';`,
        `import { run } from '@jsverse/transloco-cli';`,
        `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
      ].join('\n'),
    );

    expect(result?.content).toBe(
      [
        `import { provideTransloco } from '@jsverse/transloco';`,
        `import { run } from '@jsverse/transloco-cli';`,
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { getGlobalConfig } from '@jsverse/transloco-cli';`,
      ].join('\n'),
    );
  });

  it(`GIVEN an aliased type next to the same name imported plain
      WHEN the utils import is migrated
      THEN the aliased import is still added`, () => {
    const result = migrateConfigTypeImportSource(
      [
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
        `import { TranslocoGlobalConfig as Config } from '@jsverse/transloco-utils';`,
      ].join('\n'),
    );

    expect(result?.content).toContain(
      `import type { TranslocoGlobalConfig as Config } from '@jsverse/transloco';`,
    );
  });

  it(`GIVEN source that was already migrated
      WHEN it is migrated again
      THEN nothing changes`, () => {
    const migrated = migrateConfigTypeImportSource(
      `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';`,
    );

    expect(migrateConfigTypeImportSource(migrated!.content)).toBeNull();
  });
});

describe('findStrippingError', () => {
  it(`GIVEN a config using only erasable type syntax
      WHEN it is checked
      THEN no error is reported`, () => {
    expect(
      findStrippingError(
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';\nexport default { langs: ['en'] } satisfies TranslocoGlobalConfig;`,
      ),
    ).toBeNull();
  });

  it(`GIVEN a config declaring an enum
      WHEN it is checked
      THEN the stripping error is reported`, () => {
    expect(
      findStrippingError(
        `enum Lang { En = 'en' }\nexport default { langs: [Lang.En] };`,
      ),
    ).toBeTruthy();
  });
});

describe('findVersionFloorWarnings', () => {
  it.each(['22.18.0', '22.20.1', '24.0.0', '26.1.0'])(
    `GIVEN Node %s
      WHEN the floors are checked
      THEN nothing is reported`,
    (version) => {
      expect(findVersionFloorWarnings(version)).toEqual([]);
    },
  );

  it.each(['22.17.1', '23.11.0'])(
    `GIVEN Node %s
      WHEN the floors are checked
      THEN the type stripping range is reported`,
    (version) => {
      const [warning] = findVersionFloorWarnings(version);

      expect(warning).toContain('^22.18.0 || >=24');
      expect(warning).toContain('@jsverse/transloco-utils');
    },
  );

  it.each(['22.0.0', '22.11.0', '22.17.1', '23.11.0'])(
    `GIVEN Node %s
      WHEN the floors are checked
      THEN the packages running on the CLI are reported with the same range`,
    (version) => {
      const warnings = findVersionFloorWarnings(version);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('^22.18.0 || >=24');
      expect(warnings[0]).toContain(
        '@jsverse/transloco-optimize, @jsverse/transloco-schematics, @jsverse/transloco-validator require the same range',
      );
      expect(warnings[0]).toContain('@jsverse/transloco-cli');
    },
  );

  it(`GIVEN Node 20
      WHEN the floors are checked
      THEN the range the CLI packages require is reported`, () => {
    const [warning] = findVersionFloorWarnings('20.19.0');

    expect(warning).toContain('Node ^22.18.0 || >=24');
    expect(warning).not.toContain('>=22');
  });

  it.each(['18.20.4', '20.19.0', '21.7.3'])(
    `GIVEN Node %s
      WHEN the floors are checked
      THEN every CLI package is reported with the range it requires`,
    (version) => {
      const warnings = findVersionFloorWarnings(version);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain(
        'The Transloco CLI packages now require Node ^22.18.0 || >=24:',
      );
      expect(warnings[0]).toContain(
        'moved from chokidar 3 to 5 (ESM-only), which it now gets through @jsverse/transloco-cli',
      );
      for (const name of [
        'keys-manager',
        'optimize',
        'schematics',
        'scoped-libs',
        'utils',
        'validator',
      ]) {
        expect(warnings[0]).toContain(`@jsverse/transloco-${name}`);
      }
    },
  );
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

  it(`GIVEN a file importing marker from the top-level keys-manager package
      WHEN the migration runs
      THEN the import is repointed to the CLI's marker subpath`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/keys.ts',
        `import { marker } from '@jsverse/transloco-keys-manager';`,
      ),
    );

    expect(tree.readContent('/projects/bar/src/app/keys.ts')).toBe(
      `import { marker } from '@jsverse/transloco-cli/marker';`,
    );
  });

  it(`GIVEN an .mts file importing marker from the top-level keys-manager package
      WHEN the migration runs
      THEN the import is repointed to the CLI's marker subpath`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/keys.mts',
        `import { marker } from '@jsverse/transloco-keys-manager';`,
      ),
    );

    expect(tree.readContent('/projects/bar/src/app/keys.mts')).toBe(
      `import { marker } from '@jsverse/transloco-cli/marker';`,
    );
  });

  it.each(['keys.cts', 'keys.js', 'keys.mjs', 'keys.cjs'])(
    `GIVEN %s importing marker from the top-level keys-manager package
      WHEN the migration runs
      THEN the import is repointed, since the CLI's marker is what v9 ships`,
    async (name) => {
      const tree = await run((host) =>
        host.create(
          `/projects/bar/src/app/${name}`,
          `import { marker } from '@jsverse/transloco-keys-manager';`,
        ),
      );

      expect(tree.readContent(`/projects/bar/src/app/${name}`)).toBe(
        `import { marker } from '@jsverse/transloco-cli/marker';`,
      );
    },
  );

  it(`GIVEN marker imported alongside the removed webpack plugin
      WHEN the migration runs
      THEN marker is repointed and the leftover root import is reported`, async () => {
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/keys.ts',
        `import { TranslocoExtractKeysWebpackPlugin, marker } from '@jsverse/transloco-keys-manager';`,
      ),
    );

    expect(tree.readContent('/projects/bar/src/app/keys.ts')).toContain(
      `import { marker } from '@jsverse/transloco-cli/marker';`,
    );
    const reported = warnings.join('\n');
    expect(reported).toContain('TranslocoExtractKeysWebpackPlugin');
    expect(reported).toContain(`run 'transloco extract' instead`);
    expect(reported).toContain('/projects/bar/src/app/keys.ts');
  });

  it(`GIVEN a webpack config requiring the removed plugin from the package root
      WHEN the migration runs
      THEN the file is left untouched and reported`, async () => {
    const config = `const { TranslocoExtractKeysWebpackPlugin } = require('@jsverse/transloco-keys-manager');`;
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    const tree = await run((host) =>
      host.create('/webpack-dev.config.js', config),
    );

    expect(tree.readContent('/webpack-dev.config.js')).toBe(config);
    expect(warnings.join('\n')).toContain('/webpack-dev.config.js');
  });

  it(`GIVEN marker as the only name imported from the package root
      WHEN the migration runs
      THEN it is fully repointed and no root-entry warning is reported`, async () => {
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    await run((host) =>
      host.create(
        '/projects/bar/src/app/keys.ts',
        `import { marker } from '@jsverse/transloco-keys-manager';`,
      ),
    );

    expect(warnings.join('\n')).not.toContain('root entry point');
  });

  it.each([
    [
      '/webpack.config.js',
      `const Plugin = require('@jsverse/transloco-scoped-libs/webpack');\nmodule.exports = { plugins: [new Plugin()] };`,
    ],
    [
      '/webpack-dev.config.js',
      `const Plugin = require('@jsverse/transloco-scoped-libs/webpack.plugin');\nmodule.exports = { plugins: [new Plugin()] };`,
    ],
    [
      '/projects/bar/webpack.config.cjs',
      `const Plugin = require("@jsverse/transloco-scoped-libs/webpack.js");\nmodule.exports = { plugins: [new Plugin()] };`,
    ],
    [
      '/projects/bar/extra-webpack.config.js',
      `const Plugin = require('@jsverse/transloco-scoped-libs/webpack.plugin.js');\nmodule.exports = { plugins: [new Plugin()] };`,
    ],
    [
      '/webpack.config.ts',
      `import Plugin from '@jsverse/transloco-scoped-libs/webpack';\nexport default { plugins: [new Plugin()] };`,
    ],
    [
      '/webpack.config.mjs',
      `import Plugin from '@jsverse/transloco-scoped-libs/webpack.plugin.js';\nexport default { plugins: [new Plugin()] };`,
    ],
    [
      '/tools/webpack/plugins.js',
      `module.exports = (TranslocoScopedLibsWebpackPlugin) => [new TranslocoScopedLibsWebpackPlugin()];`,
    ],
  ])(
    `GIVEN %s loading the removed scoped-libs webpack plugin
      WHEN the migration runs
      THEN the file is left untouched and reported with the command to run instead`,
    async (path, config) => {
      const warnings: string[] = [];
      schematicRunner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });

      const tree = await run((host) => host.create(path, config));

      expect(tree.readContent(path)).toBe(config);
      const reported = warnings.join('\n');
      expect(reported).toContain(`    - ${path}`);
      expect(reported).toContain(
        `TranslocoScopedLibsWebpackPlugin was removed from '@jsverse/transloco-scoped-libs'`,
      );
      expect(reported).toContain(`'transloco-scoped-libs --watch'`);
      expect(reported).toContain(`'transloco scoped-libs --watch'`);
    },
  );

  it(`GIVEN two configs loading the removed scoped-libs webpack plugin
      WHEN the migration runs
      THEN both are listed in a single report`, async () => {
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    await run((host) => {
      host.create(
        '/webpack.config.js',
        `const Plugin = require('@jsverse/transloco-scoped-libs/webpack');`,
      );
      host.create(
        '/webpack-dev.config.js',
        `const Plugin = require('@jsverse/transloco-scoped-libs/webpack');`,
      );
    });

    const reports = warnings.filter((warning) =>
      warning.includes('TranslocoScopedLibsWebpackPlugin'),
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain('    - /webpack.config.js');
    expect(reports[0]).toContain('    - /webpack-dev.config.js');
  });

  it(`GIVEN a workspace that never references the scoped-libs webpack plugin
      WHEN the migration runs
      THEN no plugin removal is reported`, async () => {
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    await run((host) =>
      host.create('/webpack.config.js', `module.exports = { plugins: [] };`),
    );

    const reported = warnings.join('\n');
    expect(reported).not.toContain('TranslocoScopedLibsWebpackPlugin');
    expect(reported).not.toContain('/webpack.config.js');
  });

  it(`GIVEN a script using the scoped-libs package without its webpack plugin
      WHEN the migration runs
      THEN the file is left untouched and not reported`, async () => {
    const script = [
      `import run from '@jsverse/transloco-scoped-libs';`,
      `const { version } = require('@jsverse/transloco-scoped-libs/package.json');`,
    ].join('\n');
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    const tree = await run((host) =>
      host.create('/tools/copy-translations.ts', script),
    );

    expect(tree.readContent('/tools/copy-translations.ts')).toBe(script);
    const reported = warnings.join('\n');
    expect(reported).not.toContain('TranslocoScopedLibsWebpackPlugin');
    expect(reported).not.toContain('/tools/copy-translations.ts');
  });

  it(`GIVEN a root transloco.config.ts importing TranslocoGlobalConfig from the utils package
      WHEN the migration runs
      THEN it is imported type-only from @jsverse/transloco`, async () => {
    const tree = await run((host) =>
      host.create(
        '/transloco.config.ts',
        [
          `import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';`,
          `const config: TranslocoGlobalConfig = { langs: ['en'] };`,
          `export default config;`,
        ].join('\n'),
      ),
    );

    expect(tree.readContent('/transloco.config.ts')).toContain(
      `import type {TranslocoGlobalConfig} from '@jsverse/transloco';`,
    );
    expect(tree.readContent('/transloco.config.ts')).not.toContain(
      '@jsverse/transloco-utils',
    );
  });

  it(`GIVEN a custom-named config passed through --config
      WHEN the migration runs
      THEN its import is migrated too`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/i18n.config.ts',
        `import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';\nexport default {} as TranslocoGlobalConfig;`,
      ),
    );

    expect(tree.readContent('/projects/bar/i18n.config.ts')).toContain(
      `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
    );
  });

  it(`GIVEN a config that only needs the type
      WHEN the migration runs
      THEN the CLI is not added to the package.json`, async () => {
    const runner = new SchematicTestRunner('migrations', collectionPath);
    const tree = await createWorkspace(runner);
    tree.create(
      '/transloco.config.ts',
      `import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';\nexport default {} as TranslocoGlobalConfig;`,
    );
    const before = tree.readContent('/package.json');

    const migrated = await runner.runSchematic('migration-v9', {}, tree);

    expect(migrated.readContent('/package.json')).toBe(before);
    expect(runner.tasks.map((task) => task.name)).not.toContain('node-package');
  });

  describe('marker imports', () => {
    const rootImport = `import { marker } from '@jsverse/transloco-keys-manager';\nexport const key = marker('a');`;
    const subpathImport = rootImport.replace(
      `transloco-keys-manager'`,
      `transloco-keys-manager/marker'`,
    );
    const configScript = [
      `import { getGlobalConfig } from '@jsverse/transloco-utils';`,
      `console.log(getGlobalConfig());`,
    ].join('\n');

    function devDependency(tree: UnitTestTree, name: string) {
      return JSON.parse(tree.readContent('/package.json')).devDependencies?.[
        name
      ];
    }

    function capture(runner: SchematicTestRunner) {
      const warnings: string[] = [];
      const infos: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
        if (entry.level === 'info') infos.push(entry.message);
      });

      return { warnings, infos };
    }

    const nodePackageTasks = (runner: SchematicTestRunner) =>
      runner.tasks.filter((task) => task.name === 'node-package');

    async function runWith(files: Record<string, string>) {
      const runner = new SchematicTestRunner('migrations', collectionPath);
      const logs = capture(runner);
      const tree = await createWorkspace(runner);
      for (const [path, content] of Object.entries(files)) {
        tree.create(path, content);
      }

      const migrated = await runner.runSchematic('migration-v9', {}, tree);

      return { runner, migrated, ...logs };
    }

    it.each([
      ['the package root', rootImport],
      ['the old /marker subpath', subpathImport],
    ])(
      `GIVEN a file importing marker from %s
        WHEN the migration runs
        THEN it imports from @jsverse/transloco-cli/marker`,
      async (_, content) => {
        const { migrated } = await runWith({ '/src/keys.ts': content });

        expect(migrated.readContent('/src/keys.ts')).toBe(
          `import { marker } from '@jsverse/transloco-cli/marker';\nexport const key = marker('a');`,
        );
      },
    );

    it(`GIVEN a workspace that does not list the CLI
        WHEN a marker import is moved to it
        THEN the CLI is added to devDependencies at the installed v9 range and installed`, async () => {
      const { runner, migrated, infos } = await runWith({
        '/src/keys.ts': subpathImport,
      });

      const { version } = JSON.parse(
        readFileSync(nodePath.join(__dirname, '../../package.json'), 'utf-8'),
      );
      expect(devDependency(migrated, '@jsverse/transloco-cli')).toBe(
        `^${version}`,
      );
      expect(nodePackageTasks(runner)).toHaveLength(1);
      expect(infos.join('\n')).toContain(`Repointed 1 marker import(s)`);
    });

    it.each(['dependencies', 'devDependencies', 'peerDependencies'])(
      `GIVEN a workspace listing the CLI under %s
        WHEN a marker import is moved to it
        THEN its package.json is left as it was`,
      async (section) => {
        const runner = new SchematicTestRunner('migrations', collectionPath);
        const tree = await createWorkspace(runner);
        const manifest = JSON.parse(tree.readContent('/package.json'));
        manifest[section] = {
          ...manifest[section],
          '@jsverse/transloco-cli': '9.0.0',
        };
        tree.overwrite('/package.json', JSON.stringify(manifest, null, 2));
        tree.create('/src/keys.ts', rootImport);
        const before = tree.readContent('/package.json');

        const migrated = await runner.runSchematic('migration-v9', {}, tree);

        expect(migrated.readContent('/package.json')).toBe(before);
        expect(nodePackageTasks(runner)).toHaveLength(0);
      },
    );

    it(`GIVEN a workspace where both a marker import and a getGlobalConfig import move to the CLI
        WHEN the migration runs
        THEN the CLI is added once and installed once`, async () => {
      const { runner, migrated, infos, warnings } = await runWith({
        '/src/keys.ts': rootImport,
        '/scripts/show-config.mjs': configScript,
      });

      const manifest = JSON.parse(migrated.readContent('/package.json'));
      expect(manifest.devDependencies['@jsverse/transloco-cli']).toMatch(
        /^\^\d/,
      );
      expect(
        migrated.readContent('/package.json').split('"@jsverse/transloco-cli"'),
      ).toHaveLength(2);
      expect(migrated.readContent('/scripts/show-config.mjs')).toContain(
        `from '@jsverse/transloco-cli'`,
      );
      expect(
        infos.filter((message) =>
          message.includes(`Added '@jsverse/transloco-cli`),
        ),
      ).toHaveLength(1);
      expect(warnings.join('\n')).not.toContain('to your devDependencies');
      expect(nodePackageTasks(runner)).toHaveLength(1);
    });

    it.each([
      ['an array', '[]'],
      ['unparsable', '{ "devDependencies": '],
    ])(
      `GIVEN a root package.json that is %s
        WHEN a marker import is moved to the CLI
        THEN the user is asked to add the package and no addition is logged`,
      async (_, manifest) => {
        const runner = new SchematicTestRunner('migrations', collectionPath);
        const { warnings, infos } = capture(runner);
        const tree = await createWorkspace(runner);
        tree.overwrite('/package.json', manifest);
        tree.create('/src/keys.ts', rootImport);

        const migrated = await runner.runSchematic('migration-v9', {}, tree);

        expect(migrated.readContent('/package.json')).toBe(manifest);
        expect(warnings.join('\n')).toContain(
          `Add '@jsverse/transloco-cli' to your devDependencies`,
        );
        expect(infos.join('\n')).not.toContain(`Added '@jsverse/transloco-cli`);
        expect(runner.tasks).toHaveLength(0);
      },
    );

    it(`GIVEN a file that already imports marker from the CLI, and an aliased one from an old path
        WHEN the migration runs
        THEN the alias is repointed to the CLI and there is no duplicate import of the plain name`, async () => {
      const { migrated, runner } = await runWith({
        '/src/keys.ts': [
          `import { marker } from '@jsverse/transloco-cli/marker';`,
          `import { marker as again } from '@jsverse/transloco-keys-manager';`,
          `export const keys = [marker('a'), again('b')];`,
        ].join('\n'),
      });

      expect(migrated.readContent('/src/keys.ts')).toBe(
        [
          `import { marker } from '@jsverse/transloco-cli/marker';`,
          `import { marker as again } from '@jsverse/transloco-cli/marker';`,
          `export const keys = [marker('a'), again('b')];`,
        ].join('\n'),
      );
      expect(nodePackageTasks(runner)).toHaveLength(1);
    });

    it(`GIVEN a file that only has the CLI's marker import
        WHEN the migration runs
        THEN no file and no dependency changes`, async () => {
      const content = `import { marker } from '@jsverse/transloco-cli/marker';`;
      const { migrated, runner } = await runWith({ '/src/keys.ts': content });

      expect(migrated.readContent('/src/keys.ts')).toBe(content);
      expect(devDependency(migrated, '@jsverse/transloco-cli')).toBeUndefined();
      expect(runner.tasks).toHaveLength(0);
    });

    it(`GIVEN a file with a BOM and CRLF line endings importing marker next to another name
        WHEN the migration runs
        THEN the BOM and the line endings are kept`, async () => {
      const { migrated, warnings } = await runWith({
        '/src/keys.ts': `\uFEFFimport { Other, marker } from '@jsverse/transloco-keys-manager';\r\nexport const key = marker('a');\r\n`,
      });

      expect(migrated.readContent('/src/keys.ts')).toBe(
        `\uFEFFimport { Other } from '@jsverse/transloco-keys-manager';\r\nimport { marker } from '@jsverse/transloco-cli/marker';\r\nexport const key = marker('a');\r\n`,
      );
      expect(warnings.join('\n')).toContain('/src/keys.ts');
    });

    it(`GIVEN a .tsx file importing marker from an old path
        WHEN the migration runs
        THEN it imports from @jsverse/transloco-cli/marker`, async () => {
      const { migrated } = await runWith({
        '/src/view.tsx': `import { marker } from '@jsverse/transloco-keys-manager/marker';\nexport const view = <p>{marker('a')}</p>;`,
      });

      expect(migrated.readContent('/src/view.tsx')).toBe(
        `import { marker } from '@jsverse/transloco-cli/marker';\nexport const view = <p>{marker('a')}</p>;`,
      );
    });

    it.each([
      [
        '/scripts/require.cjs',
        `const { marker } = require('@jsverse/transloco-keys-manager/marker');`,
      ],
      [
        '/scripts/dynamic.mjs',
        `const { marker } = await import('@jsverse/transloco-keys-manager/marker');`,
      ],
      [
        '/scripts/reexport.ts',
        `export { marker } from '@jsverse/transloco-keys-manager/marker';`,
      ],
      [
        '/scripts/namespace.ts',
        `import * as km from '@jsverse/transloco-keys-manager/marker';\nkm.marker('a');`,
      ],
      [
        '/scripts/default.ts',
        `import km from '@jsverse/transloco-keys-manager/marker';\nkm.marker('a');`,
      ],
    ])(
      `GIVEN %s using the old /marker subpath in a way that cannot be rewritten
        WHEN the migration runs
        THEN the file is reported and left as it was`,
      async (path, content) => {
        const { migrated, warnings, runner } = await runWith({
          [path]: content,
        });

        expect(migrated.readContent(path)).toBe(content);
        expect(warnings.join('\n')).toContain(path);
        expect(
          devDependency(migrated, '@jsverse/transloco-cli'),
        ).toBeUndefined();
        expect(runner.tasks).toHaveLength(0);
      },
    );

    it(`GIVEN files that no longer touch the old paths
        WHEN the migration runs
        THEN nothing is reported about them`, async () => {
      const { warnings } = await runWith({
        '/src/keys.ts': `import { marker } from '@jsverse/transloco-cli/marker';`,
        '/src/other.ts': `import { thing } from '@jsverse/transloco-keys-manager-extra';`,
      });

      expect(warnings.join('\n')).not.toContain('/src/');
    });

    it(`GIVEN a workspace that was already migrated
        WHEN the migration runs again
        THEN no file and no task changes`, async () => {
      const { runner, migrated } = await runWith({
        '/src/keys.ts': `import { Other, marker } from '@jsverse/transloco-keys-manager';\nimport { marker as m } from '@jsverse/transloco-keys-manager/marker';`,
      });
      const files = ['/src/keys.ts', '/package.json'];
      const first = files.map((file) => migrated.readContent(file));

      const again = await runner.runSchematic('migration-v9', {}, migrated);

      expect(files.map((file) => again.readContent(file))).toEqual(first);
      expect(runner.tasks).toHaveLength(0);
    });

    describe('what is still imported from the package root', () => {
      const reportedRoot = (warnings: string[]) =>
        warnings
          .join('\n')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('- /'));

      it(`GIVEN a file importing a type of the removed webpack plugin from the package root
        WHEN the migration runs
        THEN the report names the import and says that the root exports nothing`, async () => {
        const { warnings } = await runWith({
          '/webpack.config.ts': `import type { TranslocoExtractKeysWebpackPlugin } from '@jsverse/transloco-keys-manager';\nexport const plugin: TranslocoExtractKeysWebpackPlugin | undefined = undefined;`,
        });

        expect(reportedRoot(warnings)).toEqual([
          '- /webpack.config.ts: TranslocoExtractKeysWebpackPlugin',
        ]);
        expect(warnings.join('\n')).toContain('no longer exports anything');
      });

      it(`GIVEN a file importing marker and another name from the package root
        WHEN the migration runs
        THEN only the name that is left is reported`, async () => {
        const { warnings } = await runWith({
          '/src/keys.ts': `import { Other as Renamed, marker, Third } from '@jsverse/transloco-keys-manager';`,
        });

        expect(reportedRoot(warnings)).toEqual([
          '- /src/keys.ts: Other, Third',
        ]);
      });

      it.each([
        [
          `import * as keysManager from '@jsverse/transloco-keys-manager';`,
          'everything',
        ],
        [
          `import keysManager from '@jsverse/transloco-keys-manager';`,
          'the default export',
        ],
        [`export * from '@jsverse/transloco-keys-manager';`, 'everything'],
        [`export { Plugin } from '@jsverse/transloco-keys-manager';`, 'Plugin'],
      ])(
        `GIVEN the statement %s
        WHEN the migration runs
        THEN the report says what it takes from the package root`,
        async (statement, what) => {
          const { warnings } = await runWith({ '/src/a.ts': statement });

          expect(reportedRoot(warnings)).toEqual([`- /src/a.ts: ${what}`]);
        },
      );

      it(`GIVEN a file requiring the package root
        WHEN the migration runs
        THEN the file is reported without names`, async () => {
        const { warnings } = await runWith({
          '/webpack-dev.config.js': `const { TranslocoExtractKeysWebpackPlugin } = require('@jsverse/transloco-keys-manager');`,
        });

        expect(reportedRoot(warnings)).toEqual(['- /webpack-dev.config.js']);
      });
    });
  });

  describe('getGlobalConfig imports', () => {
    const script = [
      `import { getGlobalConfig } from '@jsverse/transloco-utils';`,
      `console.log(getGlobalConfig());`,
    ].join('\n');

    function devDependency(tree: UnitTestTree, name: string) {
      return JSON.parse(tree.readContent('/package.json')).devDependencies?.[
        name
      ];
    }

    async function runWithScript(
      setup: (tree: UnitTestTree) => void = () => undefined,
    ) {
      const runner = new SchematicTestRunner('migrations', collectionPath);
      const tree = await createWorkspace(runner);
      tree.create('/scripts/show-config.mjs', script);
      setup(tree);

      const migrated = await runner.runSchematic('migration-v9', {}, tree);

      return { runner, migrated };
    }

    it(`GIVEN a script importing getGlobalConfig from the utils package
        WHEN the migration runs
        THEN it imports from @jsverse/transloco-cli`, async () => {
      const { migrated } = await runWithScript();

      expect(migrated.readContent('/scripts/show-config.mjs')).toBe(
        script.replace('transloco-utils', 'transloco-cli'),
      );
    });

    it(`GIVEN a workspace that does not list the CLI
        WHEN a getGlobalConfig import is moved to it
        THEN the CLI is added to devDependencies at the installed v9 range and installed`, async () => {
      const { runner, migrated } = await runWithScript();

      const { version } = JSON.parse(
        readFileSync(nodePath.join(__dirname, '../../package.json'), 'utf-8'),
      );
      expect(devDependency(migrated, '@jsverse/transloco-cli')).toBe(
        `^${version}`,
      );
      expect(runner.tasks.map((task) => task.name)).toContain('node-package');
    });

    it.each(['dependencies', 'devDependencies', 'peerDependencies'])(
      `GIVEN a workspace listing the CLI under %s
        WHEN a getGlobalConfig import is moved to it
        THEN its package.json is left as it was`,
      async (section) => {
        let before = '';
        const { runner, migrated } = await runWithScript((tree) => {
          const manifest = JSON.parse(tree.readContent('/package.json'));
          manifest[section] = {
            ...manifest[section],
            '@jsverse/transloco-cli': '9.0.0',
          };
          tree.overwrite('/package.json', JSON.stringify(manifest, null, 2));
          before = tree.readContent('/package.json');
        });

        expect(migrated.readContent('/package.json')).toBe(before);
        expect(runner.tasks.map((task) => task.name)).not.toContain(
          'node-package',
        );
      },
    );

    it(`GIVEN a workspace without a readable package.json
        WHEN a getGlobalConfig import is moved to the CLI
        THEN the user is asked to add the package themselves`, async () => {
      const warnings: string[] = [];
      const runner = new SchematicTestRunner('migrations', collectionPath);
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });
      const tree = new UnitTestTree(new HostTree());
      tree.create('/scripts/show-config.mjs', script);

      await runner.runSchematic('migration-v9', {}, tree);

      expect(warnings.join('\n')).toContain(
        `Add '@jsverse/transloco-cli' to your devDependencies`,
      );
      expect(runner.tasks).toHaveLength(0);
    });

    it(`GIVEN a .tsx file importing the type from the utils package
        WHEN the migration runs
        THEN it imports from @jsverse/transloco`, async () => {
      const runner = new SchematicTestRunner('migrations', collectionPath);
      const tree = await createWorkspace(runner);
      tree.create(
        '/src/config.tsx',
        `import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';\nexport const config: TranslocoGlobalConfig = { langs: [] };\nexport const view = <div>{config.langs}</div>;`,
      );

      const migrated = await runner.runSchematic('migration-v9', {}, tree);

      expect(migrated.readContent('/src/config.tsx')).toBe(
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';\nexport const config: TranslocoGlobalConfig = { langs: [] };\nexport const view = <div>{config.langs}</div>;`,
      );
    });

    it(`GIVEN a migrated file that still has a JSDoc import() of the utils package
        WHEN the migration runs
        THEN the file is reported once`, async () => {
      const warnings: string[] = [];
      const runner = new SchematicTestRunner('migrations', collectionPath);
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });
      const tree = await createWorkspace(runner);
      tree.create(
        '/scripts/jsdoc.mjs',
        `import { getGlobalConfig } from '@jsverse/transloco-utils';\n/** @type {import('@jsverse/transloco-utils').TranslocoGlobalConfig} */\nexport const config = getGlobalConfig();`,
      );

      const migrated = await runner.runSchematic('migration-v9', {}, tree);

      expect(migrated.readContent('/scripts/jsdoc.mjs')).toContain(
        `from '@jsverse/transloco-cli'`,
      );
      expect(warnings.join('\n').split('/scripts/jsdoc.mjs')).toHaveLength(2);
    });

    it(`GIVEN a file using a package named after the utils one
        WHEN the migration runs
        THEN nothing is reported about it`, async () => {
      const warnings: string[] = [];
      const runner = new SchematicTestRunner('migrations', collectionPath);
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });
      const tree = await createWorkspace(runner);
      tree.create(
        '/scripts/extra.mjs',
        `/** @type {import('@jsverse/transloco-utils-extra').Config} */\nexport const config = {};\nimport('@jsverse/transloco-utils-extra');`,
      );

      await runner.runSchematic('migration-v9', {}, tree);

      expect(warnings.join('\n')).not.toContain('/scripts/extra.mjs');
    });

    it.each([
      ['an array', '[]'],
      ['unparsable', '{ "devDependencies": '],
    ])(
      `GIVEN a root package.json that is %s
        WHEN a getGlobalConfig import is moved to the CLI
        THEN the user is asked to add the package and no addition is logged`,
      async (_, manifest) => {
        const warnings: string[] = [];
        const infos: string[] = [];
        const runner = new SchematicTestRunner('migrations', collectionPath);
        runner.logger.subscribe((entry) => {
          if (entry.level === 'warn') warnings.push(entry.message);
          if (entry.level === 'info') infos.push(entry.message);
        });
        const tree = await createWorkspace(runner);
        tree.overwrite('/package.json', manifest);
        tree.create('/scripts/show-config.mjs', script);

        const migrated = await runner.runSchematic('migration-v9', {}, tree);

        expect(migrated.readContent('/package.json')).toBe(manifest);
        expect(warnings.join('\n')).toContain(
          `Add '@jsverse/transloco-cli' to your devDependencies`,
        );
        expect(infos.join('\n')).not.toContain(`Added '@jsverse/transloco-cli`);
        expect(runner.tasks).toHaveLength(0);
      },
    );

    it(`GIVEN a workspace that was already migrated
        WHEN the migration runs again
        THEN no file and no task changes`, async () => {
      const { runner, migrated } = await runWithScript((tree) =>
        tree.create(
          '/transloco.config.ts',
          `import { getGlobalConfig, TranslocoGlobalConfig } from '@jsverse/transloco-utils';\nexport default {} as TranslocoGlobalConfig;`,
        ),
      );
      const files = [
        '/scripts/show-config.mjs',
        '/transloco.config.ts',
        '/package.json',
      ];
      const first = files.map((file) => migrated.readContent(file));

      const again = await runner.runSchematic('migration-v9', {}, migrated);

      expect(files.map((file) => again.readContent(file))).toEqual(first);
      expect(runner.tasks).toHaveLength(0);
    });

    it.each([
      [
        '/scripts/require.cjs',
        `const { getGlobalConfig } = require('@jsverse/transloco-utils');`,
      ],
      [
        '/scripts/namespace.mts',
        `import * as utils from '@jsverse/transloco-utils';\nutils.getGlobalConfig();`,
      ],
      [
        '/scripts/default.mjs',
        `import utils from '@jsverse/transloco-utils';\nutils.getGlobalConfig();`,
      ],
      [
        '/scripts/other.ts',
        `import { somethingElse } from '@jsverse/transloco-utils';`,
      ],
    ])(
      `GIVEN %s using the utils package in a way that cannot be rewritten
        WHEN the migration runs
        THEN the file is reported and left as it was`,
      async (path, content) => {
        const warnings: string[] = [];
        const runner = new SchematicTestRunner('migrations', collectionPath);
        runner.logger.subscribe((entry) => {
          if (entry.level === 'warn') warnings.push(entry.message);
        });
        const tree = await createWorkspace(runner);
        tree.create(path, content);

        const migrated = await runner.runSchematic('migration-v9', {}, tree);

        expect(migrated.readContent(path)).toBe(content);
        expect(warnings.join('\n')).toContain(path);
        expect(
          devDependency(migrated, '@jsverse/transloco-cli'),
        ).toBeUndefined();
      },
    );

    it(`GIVEN files that no longer touch the utils package
        WHEN the migration runs
        THEN nothing is reported about it`, async () => {
      const { runner } = await runWithScript();
      const warnings: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });
      const tree = await createWorkspace(runner);
      tree.create(
        '/transloco.config.ts',
        `import type { TranslocoGlobalConfig } from '@jsverse/transloco';\nexport default {} as TranslocoGlobalConfig;`,
      );

      await runner.runSchematic('migration-v9', {}, tree);

      expect(warnings.join('\n')).not.toContain(
        'is deprecated, and these files',
      );
    });
  });

  it(`GIVEN a transloco.config.ts using an enum
      WHEN the migration runs
      THEN the file is reported as unloadable and left as is`, async () => {
    const config = `enum Lang { En = 'en' }\nexport default { langs: [Lang.En] };`;
    const warnings: string[] = [];
    schematicRunner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
    });

    const tree = await run((host) =>
      host.create('/.config/translocorc.ts', config),
    );

    expect(tree.readContent('/.config/translocorc.ts')).toBe(config);
    const reported = warnings.join('\n');
    expect(reported).toContain('/.config/translocorc.ts');
    expect(reported).toContain('type stripping');
  });
});

describe('findScripts', () => {
  it(`GIVEN a package.json with scripts
      WHEN the scripts are located
      THEN every value is found with its span in the file`, () => {
    const source = `{ "name": "a", "scripts": { "x": "echo 1", "y": "echo \\"2\\"" }, "version": "1" }`;
    const scripts = findScripts(source);

    expect(scripts?.map(({ name, value }) => [name, value])).toEqual([
      ['x', 'echo 1'],
      ['y', 'echo "2"'],
    ]);
    expect(scripts?.map(({ start, end }) => source.slice(start, end))).toEqual([
      `"echo 1"`,
      `"echo \\"2\\""`,
    ]);
  });

  it(`GIVEN a scripts key inside another object
      WHEN the scripts are located
      THEN only the top-level one counts`, () => {
    const source = `{ "config": { "scripts": { "a": "b" } }, "scripts": { "c": "d" } }`;

    expect(findScripts(source)?.map(({ name }) => name)).toEqual(['c']);
  });

  it(`GIVEN a byte order mark in front of the file
      WHEN the scripts are located
      THEN it is skipped`, () => {
    expect(findScripts('\uFEFF{ "scripts": { "a": "b" } }')).toHaveLength(1);
  });

  it(`GIVEN scripts that are not all strings
      WHEN the scripts are located
      THEN only the strings are returned`, () => {
    expect(
      findScripts(`{ "scripts": { "a": "b", "c": 1, "d": null, "e": ["f"] } }`),
    ).toHaveLength(1);
  });

  it.each([
    ['empty', ''],
    ['an array', '[]'],
    ['cut short', '{ "scripts": { "a": '],
    ['holding a trailing comma', '{ "scripts": { "a": "b", } }'],
    ['followed by text', '{ "scripts": {} } x'],
  ])(
    `GIVEN a package.json that is %s
      WHEN the scripts are located
      THEN it is not read`,
    (_, source) => {
      expect(findScripts(source)).toBeNull();
    },
  );

  it(`GIVEN no scripts
      WHEN the scripts are located
      THEN there are none`, () => {
    expect(findScripts(`{ "name": "a" }`)).toEqual([]);
  });
});

describe('migration-v9 npm scripts', () => {
  const CLI = '@jsverse/transloco-cli';

  interface Layout {
    indent?: string;
    eol?: string;
    bom?: string;
    trailing?: boolean;
    listCli?: boolean;
    /** Packages listed next to the CLI, the deprecated ones that is. */
    devDependencies?: Record<string, string>;
    /** The root package.json as it is written, instead of one built from the scripts. */
    raw?: string;
  }

  function manifest(scripts: Record<string, string>, layout: Layout = {}) {
    const { indent = '  ', eol = '\n', bom = '', trailing = true } = layout;
    const json = JSON.stringify(
      {
        name: 'app',
        version: '1.0.0',
        scripts,
        devDependencies: {
          ...layout.devDependencies,
          ...(layout.listCli ? { [CLI]: '^9.0.0' } : {}),
        },
      },
      null,
      indent,
    ).replace(/\n/g, eol);

    return bom + json + (trailing ? eol : '');
  }

  async function runWith(
    files: Record<string, string>,
    rootScripts?: Record<string, string>,
    layout: Layout = {},
  ) {
    const runner = new SchematicTestRunner('migrations', collectionPath);
    const warnings: string[] = [];
    const infos: string[] = [];
    runner.logger.subscribe((entry) => {
      if (entry.level === 'warn') warnings.push(entry.message);
      if (entry.level === 'info') infos.push(entry.message);
    });
    const tree = await createWorkspace(runner);

    if (layout.raw !== undefined) {
      tree.overwrite('/package.json', layout.raw);
    } else if (rootScripts) {
      tree.overwrite('/package.json', manifest(rootScripts, layout));
    }

    for (const [path, content] of Object.entries(files)) {
      tree.create(path, content);
    }

    const migrated = await runner.runSchematic('migration-v9', {}, tree);

    return { runner, migrated, warnings, infos };
  }

  const scriptsOf = (tree: UnitTestTree, path = '/package.json') =>
    JSON.parse(tree.readContent(path)).scripts;
  const nodePackageTasks = (runner: SchematicTestRunner) =>
    runner.tasks.filter((task) => task.name === 'node-package');

  const legacy = {
    'i18n:extract': 'transloco-keys-manager extract',
    'i18n:find': 'transloco-keys-manager find',
    lint: 'ng lint',
  };

  it(`GIVEN scripts running the deprecated bins
      WHEN the migration runs
      THEN they run the transloco bin and the other scripts stay as they are`, async () => {
    const { migrated } = await runWith({}, legacy, { listCli: true });

    expect(migrated.readContent('/package.json')).toBe(
      manifest(
        {
          'i18n:extract': 'transloco extract',
          'i18n:find': 'transloco find',
          lint: 'ng lint',
        },
        { listCli: true },
      ),
    );
  });

  it.each([
    ['tabs', { indent: '\t' }],
    ['four spaces', { indent: '    ' }],
    ['windows line endings', { eol: '\r\n' }],
    ['a byte order mark', { bom: '\uFEFF' }],
    ['no newline at the end', { trailing: false }],
    [
      'all of it',
      { indent: '\t', eol: '\r\n', bom: '\uFEFF', trailing: false },
    ],
  ])(
    `GIVEN a package.json written with %s
      WHEN its scripts are migrated
      THEN the file keeps that layout`,
    async (_, layout: Layout) => {
      const { migrated } = await runWith(
        {},
        { 'i18n:find': 'transloco-keys-manager find -r -i src' },
        { ...layout, listCli: true },
      );

      expect(migrated.readContent('/package.json')).toBe(
        manifest(
          { 'i18n:find': 'transloco find -i src' },
          { ...layout, listCli: true },
        ),
      );
    },
  );

  it(`GIVEN a package.json formatted by hand
      WHEN its scripts are migrated
      THEN only the migrated script values change`, async () => {
    const before = [
      `{`,
      `    "name"   :  "app",`,
      `  "keywords": [ "a",   "b" ],`,
      `  "description": "caf\\u00e9 \\/ done",`,
      `  "scripts" : {`,
      `      "keep":"transloco-keys-manager --bogus",`,
      `      "move":"transloco-validator a.json",`,
      `   "build": "ng build"`,
      `  },`,
      `  "devDependencies": { "${CLI}": "^9.0.0" }`,
      `}`,
    ].join('\n');
    const { migrated } = await runWith({ '/packages/a/package.json': before });

    expect(migrated.readContent('/packages/a/package.json')).toBe(
      before.replace(
        `"transloco-validator a.json"`,
        `"transloco validate a.json"`,
      ),
    );
  });

  it(`GIVEN package.json files in the workspace folders
      WHEN the migration runs
      THEN the scripts of each are migrated`, async () => {
    const nested = (name: string) =>
      manifest({ [name]: 'transloco-optimize dist/ui', build: 'ng build' });
    const { migrated, infos } = await runWith({
      '/packages/ui/package.json': nested('postbuild'),
      '/projects/bar/tools/package.json': nested('optimize'),
    });

    expect(scriptsOf(migrated, '/packages/ui/package.json')).toEqual({
      postbuild: 'transloco optimize dist/ui',
      build: 'ng build',
    });
    expect(scriptsOf(migrated, '/projects/bar/tools/package.json')).toEqual({
      optimize: 'transloco optimize dist/ui',
      build: 'ng build',
    });
    expect(infos.join('\n')).toContain('/packages/ui/package.json: postbuild');
  });

  it.each([
    '/node_modules/dep/package.json',
    '/projects/bar/node_modules/dep/package.json',
    '/dist/pkg/package.json',
    '/.cache/package.json',
    '/projects/.tmp/package.json',
  ])(
    `GIVEN a package.json in %s
      WHEN the migration runs
      THEN it is not read`,
    async (path) => {
      const content = manifest({ x: 'transloco-validator a.json' });
      const { migrated, infos, warnings } = await runWith({ [path]: content });

      expect(migrated.readContent(path)).toBe(content);
      expect([...infos, ...warnings].join('\n')).not.toContain(path);
    },
  );

  it(`GIVEN a workspace that does not list the CLI
      WHEN scripts are migrated
      THEN the CLI is added to devDependencies and installed`, async () => {
    const { migrated, runner, infos } = await runWith({}, legacy);

    expect(
      JSON.parse(migrated.readContent('/package.json')).devDependencies[CLI],
    ).toMatch(/^\^9\./);
    expect(infos.join('\n')).toContain(`Added '${CLI}@^`);
    expect(nodePackageTasks(runner)).toHaveLength(1);
  });

  it(`GIVEN scripts and a marker import that both need the CLI
      WHEN the migration runs
      THEN it is added once`, async () => {
    const { runner, infos } = await runWith(
      {
        '/src/keys.ts': `import { marker } from '@jsverse/transloco-keys-manager';\nexport const key = marker('a');`,
      },
      legacy,
    );

    expect(
      infos.filter((message) => message.includes(`Added '${CLI}@`)),
    ).toHaveLength(1);
    expect(nodePackageTasks(runner)).toHaveLength(1);
  });

  it(`GIVEN a workspace that lists the CLI
      WHEN scripts are migrated
      THEN the dependencies are not touched`, async () => {
    const { runner, infos } = await runWith({}, legacy, { listCli: true });

    expect(infos.join('\n')).not.toContain('Added');
    expect(runner.tasks).toHaveLength(0);
  });

  it(`GIVEN the migration ran already
      WHEN it runs on the result
      THEN nothing changes and nothing is reported`, async () => {
    const first = await runWith({}, legacy, { listCli: true });
    const runner = new SchematicTestRunner('migrations', collectionPath);
    const lines: string[] = [];
    runner.logger.subscribe((entry) => {
      if (entry.level === 'warn' || entry.level === 'info') {
        lines.push(entry.message);
      }
    });

    const second = await runner.runSchematic(
      'migration-v9',
      {},
      first.migrated,
    );

    expect(second.readContent('/package.json')).toBe(
      first.migrated.readContent('/package.json'),
    );
    expect(lines.filter((line) => /script|bin/.test(line))).toEqual([]);
    expect(runner.tasks).toHaveLength(0);
  });

  it(`GIVEN a transloco-optimize script
      WHEN it is migrated
      THEN the user is told that the exit code on failure is different now`, async () => {
    const { infos } = await runWith(
      {},
      { optimize: 'transloco-optimize dist/app' },
      { listCli: true },
    );

    expect(infos.join('\n')).toContain(
      `'transloco optimize' exits with code 1 when it fails, where 'transloco-optimize' exited with 0`,
    );
    expect(
      infos.filter((message) => message.includes('exits with code 1')),
    ).toHaveLength(1);
  });

  it(`GIVEN several transloco-optimize scripts
      WHEN they are migrated
      THEN the exit code is mentioned once`, async () => {
    const { infos } = await runWith(
      {
        '/packages/ui/package.json': manifest({ o: 'transloco-optimize dist' }),
      },
      {
        optimize: 'transloco-optimize dist/app',
        other: 'transloco-optimize x',
      },
      { listCli: true },
    );

    expect(
      infos.filter((message) => message.includes('exits with code 1')),
    ).toHaveLength(1);
  });

  it(`GIVEN scripts of the other bins only
      WHEN they are migrated
      THEN the exit code is not mentioned`, async () => {
    const { infos } = await runWith({}, legacy, { listCli: true });

    expect(infos.join('\n')).not.toContain('exits with code 1');
  });

  it(`GIVEN scripts that were migrated
      WHEN the migration reports
      THEN it says that the deprecated packages can go once nothing runs them`, async () => {
    const { infos } = await runWith({}, legacy, { listCli: true });

    expect(infos.join('\n')).toContain(
      'Remove them once nothing runs their bins anymore',
    );
  });

  it(`GIVEN scripts that were migrated
      WHEN the dependencies are read
      THEN the deprecated packages are still listed`, async () => {
    const { migrated } = await runWith({}, legacy, {
      devDependencies: { '@jsverse/transloco-keys-manager': '^8.0.0' },
    });

    expect(
      JSON.parse(migrated.readContent('/package.json')).devDependencies,
    ).toMatchObject({
      '@jsverse/transloco-keys-manager': '^8.0.0',
      [CLI]: expect.any(String),
    });
  });

  it(`GIVEN a script that can't be moved and one that can
      WHEN the migration runs
      THEN the first is left and reported, and the second is moved`, async () => {
    const { migrated, warnings } = await runWith(
      {},
      {
        'i18n:extract': 'transloco-keys-manager extract --translationsPath src',
        'i18n:find': 'transloco-keys-manager find',
      },
      { listCli: true },
    );

    expect(scriptsOf(migrated)).toEqual({
      'i18n:extract': 'transloco-keys-manager extract --translationsPath src',
      'i18n:find': 'transloco find',
    });

    const reported = warnings.join('\n');

    expect(reported).toContain('/package.json: i18n:extract');
    expect(reported).toContain('--translationsPath is not an option');
    expect(reported).not.toContain('i18n:find');
    expect(reported).toContain("'transloco extract'");
  });

  it(`GIVEN scripts that can't be moved only
      WHEN the migration runs
      THEN the CLI is not added`, async () => {
    const { runner, migrated } = await runWith(
      {},
      { find: 'transloco-keys-manager find --bogus' },
    );

    expect(scriptsOf(migrated).find).toBe(
      'transloco-keys-manager find --bogus',
    );
    expect(
      JSON.parse(migrated.readContent('/package.json')).devDependencies,
    ).not.toHaveProperty([CLI]);
    expect(runner.tasks).toHaveLength(0);
  });

  it(`GIVEN files of a pipeline that run the deprecated bins
      WHEN the migration runs
      THEN each is reported once and none is edited`, async () => {
    const files: Record<string, string> = {
      '/.github/workflows/ci.yml': `steps:\n  - run: npx transloco-keys-manager find\n  - run: transloco-validator a.json\n`,
      '/.gitlab-ci.yml': `script:\n  - transloco-optimize dist\n`,
      '/azure-pipelines.yml': `- script: transloco-scoped-libs\n`,
      '/Jenkinsfile': `sh 'transloco-validator a.json'\n`,
      '/Makefile': `i18n:\n\t./node_modules/.bin/transloco-keys-manager extract\n`,
      '/scripts/build.sh': `#!/bin/sh\ntransloco-optimize dist\n`,
      '/project.json': `{ "targets": { "i18n": { "executor": "nx:run-commands", "options": { "command": "transloco-keys-manager extract" } } } }`,
      '/projects/bar/project.json': `{ "targets": { "i18n": { "options": { "command": "transloco-validator a.json" } } } }`,
    };
    const { migrated, warnings } = await runWith(files);

    const lines = warnings
      .join('\n')
      .split('\n')
      .map((line) => line.trim());

    for (const [path, content] of Object.entries(files)) {
      expect(migrated.readContent(path)).toBe(content);
      expect(lines.filter((line) => line === `- ${path}`)).toHaveLength(1);
    }
  });

  it(`GIVEN files that only mention the bins as a name or a package
      WHEN the migration runs
      THEN they are not reported`, async () => {
    const files: Record<string, string> = {
      '/.github/workflows/ci.yml': `steps:\n  - run: rimraf dist/transloco-optimize\n  - run: pnpm add @jsverse/transloco-keys-manager\n`,
      '/Makefile': `clean:\n\trm -rf out/transloco-validator.log\n`,
      '/scripts/build.sh': `echo "ng build"\n`,
      '/notes.md': `Run transloco-keys-manager extract before building.`,
      '/docs.txt': `transloco-validator`,
    };
    const { warnings } = await runWith(files);

    const reported = warnings.join('\n');

    for (const path of Object.keys(files)) {
      expect(reported).not.toContain(path);
    }
  });

  it(`GIVEN a workspace with nothing to migrate
      WHEN the migration runs
      THEN the scripts step says nothing and the package.json is untouched`, async () => {
    const scripts = { build: 'ng build', i18n: 'transloco extract -i src' };
    const { migrated, warnings, infos, runner } = await runWith({}, scripts, {
      listCli: true,
    });

    expect(migrated.readContent('/package.json')).toBe(
      manifest(scripts, { listCli: true }),
    );
    expect(
      [...warnings, ...infos].filter((line) =>
        /npm script|deprecated bin|exits with code/.test(line),
      ),
    ).toEqual([]);
    expect(runner.tasks).toHaveLength(0);
  });

  it.each([
    ['unparsable', '{ "scripts": '],
    ['without scripts', '{ "name": "a" }'],
    ['an array', '[]'],
  ])(
    `GIVEN a nested package.json that is %s
      WHEN the migration runs
      THEN it is left as it is`,
    async (_, content) => {
      const { migrated } = await runWith({
        '/packages/a/package.json': content,
      });

      expect(migrated.readContent('/packages/a/package.json')).toBe(content);
    },
  );

  it(`GIVEN a script holding quotes and a line break
      WHEN it is migrated
      THEN the value is written back as valid JSON`, async () => {
    const script = `transloco-keys-manager extract --default-value "Say \\"hi\\"" -p x\necho 'done'`;
    const { migrated } = await runWith({}, { i18n: script }, { listCli: true });

    expect(scriptsOf(migrated).i18n).toBe(
      `transloco extract --default-value "Say \\"hi\\""\necho 'done'`,
    );
  });

  describe('a --config path', () => {
    const MISSING = 'was not found';
    const STOPS = 'stops when the --config path does not exist';

    /** The scripts of a package.json that were reported, by name. */
    const reportedScripts = (warnings: string[], path = '/package.json') =>
      warnings
        .join('\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith(`- ${path}: `))
        .map((line) => line.slice(`- ${path}: `.length));

    it.each(['extract', 'find'])(
      `GIVEN a --config path to a file of the workspace
       WHEN the %s script is migrated
       THEN it is rewritten in every spelling`,
      async (command) => {
        const scripts = {
          a: `transloco-keys-manager ${command} --config tools/conf.js`,
          b: `transloco-keys-manager ${command} --config=./tools/conf.js`,
          c: `transloco-keys-manager ${command} -c tools/conf.js`,
        };
        const { migrated, warnings } = await runWith(
          { '/tools/conf.js': 'module.exports = {};' },
          scripts,
          { listCli: true },
        );

        expect(scriptsOf(migrated)).toEqual({
          a: `transloco ${command} --config tools/conf.js`,
          b: `transloco ${command} --config=./tools/conf.js`,
          c: `transloco ${command} -c tools/conf.js`,
        });
        expect(warnings.join('\n')).not.toContain('deprecated bin');
      },
    );

    it(`GIVEN a --config path to a folder of the workspace
        WHEN the script is migrated
        THEN it is rewritten`, async () => {
      const { migrated } = await runWith(
        { '/tools/transloco.config.js': 'module.exports = {};' },
        { i18n: 'transloco-keys-manager extract --config tools' },
        { listCli: true },
      );

      expect(scriptsOf(migrated).i18n).toBe('transloco extract --config tools');
    });

    it.each([
      ['--config missing.config.js', 'missing.config.js'],
      ['--config=missing.config.js', 'missing.config.js'],
      ['-c missing.config.js', 'missing.config.js'],
      ['--config ./tools/nope', './tools/nope'],
      ['-c tools/conf.js/', 'tools/conf.js/'],
    ])(
      `GIVEN the option %s, a path that is not in the workspace
       WHEN the extract and find scripts are migrated
       THEN they are left, and reported with the path not found and the new bin stopping on it`,
      async (option, path) => {
        const extract = `transloco-keys-manager extract ${option}`;
        const find = `transloco-keys-manager find ${option}`;
        const { migrated, warnings, runner } = await runWith(
          { '/tools/conf.js': '' },
          { extract, find },
          { listCli: true },
        );

        expect(scriptsOf(migrated)).toEqual({ extract, find });

        const reported = warnings.join('\n');

        expect(reportedScripts(warnings)).toHaveLength(2);
        expect(reported).toContain(`'${path}', which ${MISSING}`);
        expect(reported).toContain(STOPS);
        expect(reported).toContain(
          'where transloco-keys-manager ignores a missing path and uses the configuration it finds',
        );
        expect(runner.tasks).toHaveLength(0);
      },
    );

    it(`GIVEN a script of a nested package.json with a --config path
        WHEN the migration runs
        THEN the path is looked up in the folder of that package.json`, async () => {
      const here = manifest({
        found: 'transloco-keys-manager extract -c conf/t.js',
        lost: 'transloco-keys-manager extract -c ../conf/t.js',
      });
      const { migrated, warnings } = await runWith(
        {
          '/packages/a/package.json': here,
          '/packages/a/conf/t.js': '',
          // next to the root package.json, where the first one is not looked for
          '/conf/t.js': '',
        },
        undefined,
        { listCli: true },
      );

      expect(scriptsOf(migrated, '/packages/a/package.json')).toEqual({
        found: 'transloco extract -c conf/t.js',
        lost: 'transloco-keys-manager extract -c ../conf/t.js',
      });
      expect(reportedScripts(warnings, '/packages/a/package.json')).toEqual([
        expect.stringMatching(
          /^lost: -c points at '..\/conf\/t.js', which was not found/,
        ),
      ]);
    });

    it(`GIVEN a nested package.json whose --config path exists only at the root
        WHEN the migration runs
        THEN the script is left`, async () => {
      const { migrated } = await runWith(
        {
          '/packages/a/package.json': manifest({
            i18n: 'transloco-keys-manager find --config conf/t.js',
          }),
          '/conf/t.js': '',
        },
        undefined,
        { listCli: true },
      );

      expect(scriptsOf(migrated, '/packages/a/package.json').i18n).toBe(
        'transloco-keys-manager find --config conf/t.js',
      );
    });

    it.each([
      ['a variable', '$CONFIG'],
      ['a variable in quotes', '"$DIR/conf.js"'],
      ['a literal dollar', "'$CONFIG'"],
      ['a glob', "'tools/*.js'"],
      ['a home folder', "'~/conf.js'"],
      ['an absolute path', '/etc/transloco/conf.js'],
      ['a path out of the workspace', '../../conf.js'],
    ])(
      `GIVEN a --config path that is %s
       WHEN the script is migrated
       THEN it is left, even though a file may be there`,
      async (_, path) => {
        const script = `transloco-keys-manager extract --config ${path}`;
        const { migrated, warnings } = await runWith(
          { '/tools/conf.js': '' },
          { i18n: script },
          { listCli: true },
        );

        expect(scriptsOf(migrated).i18n).toBe(script);
        expect(reportedScripts(warnings)).toHaveLength(1);
      },
    );

    it(`GIVEN a script that changes folder before using a --config path found at the root
        WHEN the migration runs
        THEN it is left, as the bin runs in the other folder`, async () => {
      const script = 'cd app && transloco-keys-manager extract -c conf.js';
      const { migrated, warnings } = await runWith(
        { '/conf.js': '', '/app/keep.txt': '' },
        { i18n: script },
        { listCli: true },
      );

      expect(scriptsOf(migrated).i18n).toBe(script);
      expect(reportedScripts(warnings)).toEqual([
        expect.stringContaining(
          'the script changes folder before this command',
        ),
      ]);
    });

    it(`GIVEN a script that was left for its --config path
        WHEN the migration runs on the result
        THEN the script is the same and is reported again`, async () => {
      const first = await runWith(
        {},
        { i18n: 'transloco-keys-manager extract -c nope.js' },
        { listCli: true },
      );
      const runner = new SchematicTestRunner('migrations', collectionPath);
      const warnings: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn') warnings.push(entry.message);
      });
      const second = await runner.runSchematic(
        'migration-v9',
        {},
        first.migrated,
      );

      expect(second.readContent('/package.json')).toBe(
        first.migrated.readContent('/package.json'),
      );
      expect(reportedScripts(warnings)).toEqual([
        expect.stringContaining(`which ${MISSING}`),
      ]);
    });
  });

  describe('a bin that is still used', () => {
    const STILL_USED =
      'the old bin is still used here and could not be rewritten automatically';

    const reportedLines = (warnings: string[]) =>
      warnings
        .join('\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- /package.json: '));

    it.each([
      'sudo -u bob transloco-validator a.json',
      'env -i transloco-optimize dist',
      'nodemon --exec transloco-optimize dist',
      'nodemon --exec "transloco-optimize dist"',
      'nodemon --watch src --exec "npx transloco-keys-manager extract"',
      'pnpm --filter x exec transloco-validator a.json',
      'yarn workspace x run transloco-validator a.json',
      'cross-env-shell "transloco-validator a.json"',
      'cross-env-shell transloco-validator a.json',
      'echo transloco-keys-manager',
      'npm run transloco-scoped-libs -- --watch',
      'npx @jsverse/transloco-validator a.json',
      'node node_modules/@jsverse/transloco-validator/src/index.js a.json',
    ])(
      `GIVEN the script %s
       WHEN the migration runs
       THEN it is left as it is and reported once`,
      async (script) => {
        const { migrated, warnings } = await runWith(
          {},
          { i18n: script },
          { listCli: true },
        );

        expect(scriptsOf(migrated).i18n).toBe(script);
        expect(reportedLines(warnings)).toHaveLength(1);
        expect(reportedLines(warnings)[0]).toMatch(/^- \/package.json: i18n: /);
      },
    );

    it.each([
      'sudo -u bob transloco-validator a.json',
      'env -i transloco-optimize dist',
      'nodemon --exec transloco-optimize dist',
      'pnpm --filter x exec transloco-validator a.json',
      'yarn workspace x run transloco-validator a.json',
      'echo transloco-keys-manager',
    ])(
      `GIVEN the script %s that was not read at all
       WHEN the migration runs
       THEN the reason is that the old bin is still used`,
      async (script) => {
        const { warnings } = await runWith(
          {},
          { i18n: script },
          { listCli: true },
        );

        expect(reportedLines(warnings)).toEqual([
          `- /package.json: i18n: ${STILL_USED}`,
        ]);
      },
    );

    it(`GIVEN a script that was left for another reason and holds the bin by name
        WHEN the migration runs
        THEN it is reported once, with the first reason`, async () => {
      const { warnings } = await runWith(
        {},
        { i18n: 'transloco-keys-manager extract --bogus' },
        { listCli: true },
      );

      expect(reportedLines(warnings)).toEqual([
        expect.stringContaining('--bogus is not an option'),
      ]);
      expect(warnings.join('\n')).not.toContain(STILL_USED);
    });

    it(`GIVEN a script with a command that can be moved and a shape that can't
        WHEN the migration runs
        THEN the whole script is left and reported once`, async () => {
      const script =
        'transloco-validator a.json && nodemon --exec transloco-optimize dist';
      const { migrated, warnings } = await runWith(
        {},
        { i18n: script },
        { listCli: true },
      );

      expect(scriptsOf(migrated).i18n).toBe(script);
      expect(reportedLines(warnings)).toEqual([
        `- /package.json: i18n: ${STILL_USED}`,
      ]);
    });

    it.each([
      'my-transloco-validator a.json',
      'transloco-validator-extra a.json',
      'transloco-optimizer dist',
      'rimraf dist/transloco-optimize/x',
      'cp transloco-validator/a.json b',
      'git add transloco-validator.log',
      'node tools/transloco-optimize.js',
      'pnpm add @jsverse/transloco-keys-manager',
      'echo @jsverse/transloco-validator',
    ])(
      `GIVEN the script %s that holds a bin only as a part of another word, a path or a package name
       WHEN the migration runs
       THEN it is not reported`,
      async (script) => {
        const { migrated, warnings } = await runWith(
          {},
          { i18n: script },
          { listCli: true },
        );

        expect(scriptsOf(migrated).i18n).toBe(script);
        expect(warnings.join('\n')).not.toContain('i18n');
        expect(warnings.join('\n')).not.toContain('deprecated bin');
      },
    );

    it(`GIVEN scripts run with sudo and with env
        WHEN the migration runs
        THEN they are rewritten and nothing is reported`, async () => {
      const { migrated, warnings } = await runWith(
        {},
        {
          validate: 'sudo transloco-validator a.json',
          optimize: 'env CI=1 transloco-optimize dist',
          extract: 'sudo env A=1 transloco-keys-manager extract -i src',
        },
        { listCli: true },
      );

      expect(scriptsOf(migrated)).toEqual({
        validate: 'sudo transloco validate a.json',
        optimize: 'env CI=1 transloco optimize dist',
        extract: 'sudo env A=1 transloco extract -i src',
      });
      expect(warnings.join('\n')).not.toContain('deprecated bin');
    });

    it(`GIVEN the sudo and env scripts were migrated
        WHEN the migration runs on the result
        THEN nothing changes and nothing is reported`, async () => {
      const first = await runWith(
        {},
        {
          validate: 'sudo transloco-validator a.json',
          optimize: 'env CI=1 transloco-optimize dist',
        },
        { listCli: true },
      );
      const runner = new SchematicTestRunner('migrations', collectionPath);
      const lines: string[] = [];
      runner.logger.subscribe((entry) => {
        if (entry.level === 'warn' || entry.level === 'info') {
          lines.push(entry.message);
        }
      });
      const second = await runner.runSchematic(
        'migration-v9',
        {},
        first.migrated,
      );

      expect(second.readContent('/package.json')).toBe(
        first.migrated.readContent('/package.json'),
      );
      expect(lines.filter((line) => /script|bin/.test(line))).toEqual([]);
    });
  });

  describe('a bin called through its Windows launcher', () => {
    const reported = (warnings: string[]) =>
      warnings
        .join('\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- /package.json: '));

    it.each([
      ['transloco-keys-manager.cmd extract', '.cmd'],
      ['transloco-keys-manager.ps1 extract', '.ps1'],
      ['transloco-optimize.exe dist', '.exe'],
      ['transloco-validator.CMD a.json', '.CMD'],
      ['npx transloco-scoped-libs.cmd', '.cmd'],
      ['./node_modules/.bin/transloco-keys-manager.cmd find', '.cmd'],
    ])(
      `GIVEN the script %s
       WHEN the migration runs
       THEN it is left as it is and reported with the suffix`,
      async (script, suffix) => {
        const { migrated, warnings } = await runWith(
          {},
          { i18n: script },
          { listCli: true },
        );

        expect(scriptsOf(migrated).i18n).toBe(script);
        expect(reported(warnings)).toHaveLength(1);
        expect(reported(warnings)[0]).toContain(
          `is run through its ${suffix} launcher`,
        );
      },
    );

    it(`GIVEN a script chaining a launcher and a bin that can be moved
        WHEN the migration runs
        THEN the whole script is left as it is and reported`, async () => {
      const script =
        'transloco-keys-manager extract && transloco-optimize.cmd dist';
      const { migrated, warnings } = await runWith(
        {},
        { i18n: script },
        { listCli: true },
      );

      expect(scriptsOf(migrated).i18n).toBe(script);
      expect(reported(warnings)).toHaveLength(1);
    });

    it(`GIVEN a launcher run from a CI pipeline
        WHEN the migration runs
        THEN the file is listed and not edited`, async () => {
      const pipeline = `steps:\n  - run: transloco-validator.cmd a.json\n`;
      const { migrated, warnings } = await runWith({
        '/.github/workflows/ci.yml': pipeline,
      });

      expect(migrated.readContent('/.github/workflows/ci.yml')).toBe(pipeline);
      expect(warnings.join('\n')).toContain('/.github/workflows/ci.yml');
    });

    it.each([
      'cat transloco-validator.cmdx',
      'git add transloco-validator.log',
      'echo transloco-validator.cmd.bak',
    ])(
      `GIVEN the script %s
       WHEN the migration runs
       THEN no launcher is reported`,
      async (script) => {
        const { migrated, warnings } = await runWith(
          {},
          { i18n: script },
          { listCli: true },
        );

        expect(scriptsOf(migrated).i18n).toBe(script);
        expect(reported(warnings)).toHaveLength(0);
      },
    );
  });

  describe('the other files of a pipeline', () => {
    const files: Record<string, string> = {
      '/.circleci/config.yml': `jobs:\n  i18n:\n    steps:\n      - run: npx transloco-keys-manager find\n`,
      '/bitbucket-pipelines.yml': `pipelines:\n  default:\n    - step:\n        script:\n          - transloco-validator a.json\n`,
      '/.husky/pre-commit': `#!/bin/sh\nnpx transloco-keys-manager find\n`,
      '/.lintstagedrc': `{ "*.json": "transloco-validator" }`,
      '/.lintstagedrc.json': `{ "*.json": "transloco-validator" }`,
      '/.lintstagedrc.js': `module.exports = { '*.json': 'transloco-validator' };`,
      '/lint-staged.config.mjs': `export default { '*.json': 'transloco-validator' };`,
      '/Dockerfile': `FROM node\nRUN npx transloco-optimize dist\n`,
      '/Dockerfile.prod': `FROM node\nRUN transloco-optimize dist\n`,
      '/docker-compose.yml': `services:\n  i18n:\n    command: transloco-keys-manager extract\n`,
      '/docker-compose.override.yml': `services:\n  i18n:\n    command: transloco-keys-manager extract\n`,
      '/Taskfile.yml': `tasks:\n  i18n:\n    cmds:\n      - transloco-scoped-libs\n`,
      '/justfile': `i18n:\n    transloco-keys-manager extract\n`,
      '/apps/web/Dockerfile': `RUN transloco-optimize dist\n`,
    };

    it.each(Object.keys(files))(
      `GIVEN the file %s that runs a deprecated bin
       WHEN the migration runs
       THEN it is reported once and not edited`,
      async (path) => {
        const { migrated, warnings } = await runWith({ [path]: files[path] });
        const lines = warnings
          .join('\n')
          .split('\n')
          .map((line) => line.trim());

        expect(migrated.readContent(path)).toBe(files[path]);
        expect(lines.filter((line) => line === `- ${path}`)).toHaveLength(1);
      },
    );

    it.each([
      '/.husky/_/husky.sh',
      '/.husky/_/pre-commit',
      '/.husky/hooks/pre-commit',
    ])(
      `GIVEN the file %s deeper in the husky folder
       WHEN the migration runs
       THEN it is not reported`,
      async (path) => {
        const { warnings } = await runWith({
          [path]: `npx transloco-keys-manager find\n`,
        });

        expect(warnings.join('\n')).not.toContain(path);
      },
    );

    it.each([
      '/.circleci/config.yml',
      '/.husky/pre-commit',
      '/Dockerfile.prod',
      '/justfile',
    ])(
      `GIVEN the file %s that only names a bin as a part of a path
       WHEN the migration runs
       THEN it is not reported`,
      async (path) => {
        const { warnings } = await runWith({
          [path]: `run: rimraf dist/transloco-optimize\n`,
        });

        expect(warnings.join('\n')).not.toContain(path);
      },
    );
  });

  describe('a package.json that starts with a byte order mark', () => {
    const MANUAL = `Add '${CLI}' to your devDependencies`;

    /** A root package.json with a BOM, running a deprecated bin. */
    const bomManifest = (dependencies: Record<string, unknown> = {}) =>
      '\uFEFF' +
      JSON.stringify(
        {
          name: 'app',
          scripts: { i18n: 'transloco-keys-manager extract' },
          ...dependencies,
        },
        null,
        2,
      ) +
      '\n';

    it(`GIVEN a root package.json with a BOM that does not list the CLI
        WHEN the scripts are migrated
        THEN the CLI is added without asking the user to add it`, async () => {
      const { migrated, runner, infos, warnings } = await runWith(
        {},
        undefined,
        { raw: bomManifest() },
      );

      expect(warnings.join('\n')).not.toContain(MANUAL);
      expect(infos.join('\n')).toContain(`Added '${CLI}@^`);
      expect(nodePackageTasks(runner)).toHaveLength(1);
      expect(migrated.readContent('/package.json').startsWith('\uFEFF')).toBe(
        true,
      );
      const written = JSON.parse(
        migrated.readContent('/package.json').replace('\uFEFF', ''),
      );

      expect(written.devDependencies[CLI]).toMatch(/^\^9\./);
      expect(written.scripts.i18n).toBe('transloco extract');
    });

    it.each(['dependencies', 'devDependencies'])(
      `GIVEN a root package.json with a BOM that lists the CLI in %s
       WHEN the scripts are migrated
       THEN the dependencies are not touched and the user is not asked to add it`,
      async (section) => {
        const raw = bomManifest({ [section]: { [CLI]: '^9.0.0' } });
        const { migrated, runner, infos, warnings } = await runWith(
          {},
          undefined,
          { raw },
        );

        expect(warnings.join('\n')).not.toContain(MANUAL);
        expect(infos.join('\n')).not.toContain('Added');
        expect(runner.tasks).toHaveLength(0);
        expect(migrated.readContent('/package.json')).toBe(
          raw.replace(
            '"transloco-keys-manager extract"',
            '"transloco extract"',
          ),
        );
      },
    );

    it(`GIVEN a root package.json that cannot be read
        WHEN the scripts are migrated
        THEN the user is asked to add the CLI`, async () => {
      const { warnings } = await runWith(
        {
          '/packages/a/package.json': manifest({
            i18n: 'transloco-keys-manager extract',
          }),
        },
        undefined,
        { raw: '\uFEFF{ "scripts": ' },
      );

      expect(warnings.join('\n')).toContain(MANUAL);
    });
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

describe('migration-v9 keeps the formatting of package.json', () => {
  const CLI = '@jsverse/transloco-cli';
  const markerImport = `import { marker } from '@jsverse/transloco-keys-manager';\nexport const key = marker('a');`;
  const configImport = `import { getGlobalConfig } from '@jsverse/transloco-utils';\nconsole.log(getGlobalConfig());`;
  const legacyScript = 'transloco-keys-manager extract';

  interface Layout {
    indent?: string | number;
    eol?: string;
    bom?: string;
    trailing?: boolean;
  }

  function manifest(content: object, layout: Layout = {}) {
    const { indent = 2, eol = '\n', bom = '', trailing = true } = layout;

    return (
      bom +
      JSON.stringify(content, null, indent).replace(/\n/g, eol) +
      (trailing ? eol : '')
    );
  }

  const app = {
    name: 'app',
    scripts: { build: 'ng build' },
    dependencies: { '@angular/core': '^20.0.0' },
    devDependencies: { '@angular/cli': '^20.0.0', typescript: '~5.9.0' },
  };

  /** `output` without the text it holds on top of `input`, which is `input` when nothing else changed. */
  function withoutInserted(input: string, output: string) {
    const length = output.length - input.length;
    let prefix = 0;

    while (prefix < input.length && input[prefix] === output[prefix]) prefix++;

    return output.slice(0, prefix) + output.slice(prefix + length);
  }

  const nodePackageTasks = (runner: SchematicTestRunner) =>
    runner.tasks.filter((task) => task.name === 'node-package');

  async function runWith(raw: string, files: Record<string, string>) {
    const runner = new SchematicTestRunner('migrations', collectionPath);
    const tree = await createWorkspace(runner);

    tree.overwrite('/package.json', raw);

    for (const [path, content] of Object.entries(files)) {
      tree.create(path, content);
    }

    const migrated = await runner.runSchematic('migration-v9', {}, tree);

    return { runner, migrated };
  }

  it.each<[string, Layout]>([
    ['four spaces and a final newline', { indent: 4 }],
    ['tabs', { indent: '\t' }],
    ['CRLF line endings', { eol: '\r\n' }],
    ['a byte order mark', { bom: '\uFEFF' }],
    ['no final newline', { trailing: false }],
    ['a single line', { indent: 0, trailing: false }],
  ])(
    `GIVEN a package.json written with %s
      WHEN the migration adds the CLI
      THEN only the entry is added and the install is scheduled once`,
    async (_, layout) => {
      const input = manifest(app, layout);

      const { runner, migrated } = await runWith(input, {
        '/src/keys.ts': markerImport,
      });
      const output = migrated.readContent('/package.json');
      const parsed = JSON.parse(output.replace(/^\uFEFF/, ''));

      expect(parsed.devDependencies[CLI]).toMatch(/^\^\d/);
      expect(output.split(`"${CLI}"`)).toHaveLength(2);
      expect(withoutInserted(input, output)).toBe(input);
      expect(nodePackageTasks(runner)).toHaveLength(1);
    },
  );

  it(`GIVEN a package.json without devDependencies
      WHEN the migration adds the CLI
      THEN the section is created after dependencies in the style of the file`, async () => {
    const input = manifest(
      { name: 'app', dependencies: app.dependencies, scripts: app.scripts },
      { indent: 4, eol: '\r\n' },
    );

    const { migrated } = await runWith(input, { '/src/keys.ts': markerImport });
    const output = migrated.readContent('/package.json');

    expect(Object.keys(JSON.parse(output))).toEqual([
      'name',
      'dependencies',
      'devDependencies',
      'scripts',
    ]);
    expect(withoutInserted(input, output)).toBe(input);
    expect(output).not.toMatch(/(?<!\r)\n/);
  });

  it(`GIVEN a workspace where the marker step, the config step and the scripts step all need the CLI
      WHEN the migration runs
      THEN the CLI is added once, the scripts are moved, and nothing else in the file changes`, async () => {
    const input = manifest(
      { ...app, scripts: { build: 'ng build', i18n: legacyScript } },
      { indent: 4, bom: '\uFEFF' },
    );

    const { runner, migrated } = await runWith(input, {
      '/src/keys.ts': markerImport,
      '/scripts/config.mjs': configImport,
    });
    const output = migrated.readContent('/package.json');
    const parsed = JSON.parse(output.replace(/^\uFEFF/, ''));

    expect(output.split(`"${CLI}"`)).toHaveLength(2);
    expect(parsed.scripts.i18n).toBe('transloco extract');
    expect(
      withoutInserted(
        input,
        output.replace('"transloco extract"', `"${legacyScript}"`),
      ),
    ).toBe(input);
    expect(nodePackageTasks(runner)).toHaveLength(1);
  });

  it(`GIVEN a package.json where the CLI is only needed for the moved scripts
      WHEN the migration runs
      THEN the scripts and the entry compose into one coherent file`, async () => {
    const input = manifest(
      { ...app, scripts: { i18n: legacyScript } },
      { indent: '\t', eol: '\r\n', trailing: false },
    );

    const { runner, migrated } = await runWith(input, {});
    const output = migrated.readContent('/package.json');

    expect(JSON.parse(output).scripts.i18n).toBe('transloco extract');
    expect(JSON.parse(output).devDependencies[CLI]).toMatch(/^\^\d/);
    expect(output).not.toMatch(/(?<!\r)\n/);
    expect(output.endsWith('\n')).toBe(false);
    expect(nodePackageTasks(runner)).toHaveLength(1);
  });

  it.each(['dependencies', 'devDependencies'])(
    `GIVEN a package.json that lists the CLI in %s
      WHEN the migration runs
      THEN the file is not touched and nothing is installed`,
    async (section) => {
      const input = manifest(
        { ...app, [section]: { ...(app as any)[section], [CLI]: '^9.0.0' } },
        { indent: 4 },
      );

      const { runner, migrated } = await runWith(input, {
        '/src/keys.ts': markerImport,
      });

      expect(migrated.readContent('/package.json')).toBe(input);
      expect(nodePackageTasks(runner)).toHaveLength(0);
    },
  );

  it(`GIVEN a package.json the migration already updated
      WHEN the migration runs again
      THEN the file stays as it is and nothing is installed`, async () => {
    const input = manifest(app, { indent: 4, eol: '\r\n' });
    const { migrated } = await runWith(input, { '/src/keys.ts': markerImport });
    const first = migrated.readContent('/package.json');

    const runner = new SchematicTestRunner('migrations', collectionPath);
    const again = await runner.runSchematic('migration-v9', {}, migrated);

    expect(again.readContent('/package.json')).toBe(first);
    expect(nodePackageTasks(runner)).toHaveLength(0);
  });
});
