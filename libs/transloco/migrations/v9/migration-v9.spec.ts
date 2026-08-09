import * as nodePath from 'node:path';

import { HostTree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { createWorkspace } from '../../schematics-core/testing';

import { migrateInlineTemplates, migrateTemplate } from './template-utils';
import { usesGlobalTranslateFn } from './global-translate-fn';

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

  it(`GIVEN an application that already provides the global translate fn
      WHEN the migration runs
      THEN the provider is not added twice`, async () => {
    const tree = await run((host) =>
      host.create(
        '/projects/bar/src/app/greeter.ts',
        [
          `import { translate, provideGlobalTranslateFn } from '@jsverse/transloco';`,
          `export const providers = [provideGlobalTranslateFn()];`,
          `export const greet = () => translate('hello');`,
        ].join('\n'),
      ),
    );

    const occurrences = tree
      .readContent('/projects/bar/src/app/app.config.ts')
      .match(/provideGlobalTranslateFn/g);

    expect(occurrences).toBeNull();
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
