import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { migrateNgxTranslate } from './migrate-ngx-translate.js';

/**
 * What the migration of the schematic wrote, recorded from it before it moved:
 * every `expected` below is the output of that code for that input.
 */
describe('migrateNgxTranslate', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-ngx-migrate-')),
    );
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');

  /** Everything printed, as plain text, one entry per `console.log`. */
  const printed = () =>
    log.mock.calls.map(([message]) => stripVTControlCharacters(message));

  const steps = (kind: 'HTML' | 'TS', names: string[]) => [
    `\nMigrating ${kind} files 📜`,
    ...names.flatMap((name, index) => [
      `⏳ Step ${index + 1}/${names.length}: Migrating ${name}`,
      `✅ Step ${index + 1}/${names.length}: Migrating ${name}`,
    ]),
  ];

  const done = [
    '\n              🌵 Done! 🌵',
    'Welcome to a better translation experience 🌐',
    '\nFor more information about this script please visit 👉 https://jsverse.github.io/transloco/docs/migration/ngx\n',
  ];

  describe('templates', () => {
    it(`GIVEN templates with the directive, its bindings and the pipe
        WHEN the migration runs
        THEN they are rewritten for Transloco, wherever the folder nests them`, () => {
      write(
        'app/app.component.html',
        `<h1 translate="app.title"></h1>
<p [translate]="'app.subtitle'" [translateParams]="{ name: user }"></p>
<span>{{ 'app.hello' | translate: { name: user } }}</span>
<button [title]="'app.save' | translate">{{ "app.save" | translate }}</button>
`,
      );
      write(
        'app/shared/menu/menu-item.component.html',
        `<span translate>menu.item</span>
<span [translate]="key"></span>
`,
      );
      write(
        'app/home/home.component.html',
        `<div>
  <h2>{{ 'home.title' | translate }}</h2>
  <app-card [header]="'home.card.header' | translate" [body]="('home.card.body' | translate) + ': ' + (n | number: '1.0-2')"></app-card>
  <p translate='home.intro'>Intro</p>
</div>
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/app.component.html'))
        .toBe(`<h1 transloco="app.title"></h1>
<p [transloco]="'app.subtitle'" [translocoParams]="{ name: user }"></p>
<span>{{ 'app.hello' | transloco: { name: user } }}</span>
<button [title]="'app.save' | transloco">{{ "app.save" | transloco }}</button>
`);
      expect(read('app/shared/menu/menu-item.component.html'))
        .toBe(`<span translate>menu.item</span>
<span [transloco]="key"></span>
`);
      expect(read('app/home/home.component.html')).toBe(`<div>
  <h2>{{ 'home.title' | transloco }}</h2>
  <app-card [header]="'home.card.header' | transloco" [body]="('home.card.body' | transloco) + ': ' + (n | number: '1.0-2')"></app-card>
  <p transloco='home.intro'>Intro</p>
</div>
`);
    });

    it(`GIVEN a template with Windows line endings
        WHEN the migration runs
        THEN the line endings are kept`, () => {
      write(
        'app/crlf.component.html',
        `<p>{{ 'crlf.a' | translate }}</p>\r\n<p [translate]="'crlf.b'"></p>\r\n`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/crlf.component.html')).toBe(
        `<p>{{ 'crlf.a' | transloco }}</p>\r\n<p [transloco]="'crlf.b'"></p>\r\n`,
      );
    });
  });

  describe('sources', () => {
    it(`GIVEN a component injecting the TranslateService
        WHEN the migration runs
        THEN the import, the injection and every use of the service with a counterpart are rewritten, and set() is left and printed`, () => {
      write(
        'app/app.component.ts',
        `import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    const hello = this.translate.instant('app.hello');
    this.translate.get('app.title').subscribe((v) => console.log(v));
    this.translate.stream('app.stream').subscribe();
    const lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe(() => {});
    this.translate.set('k', 'v');
  }
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/app.component.ts')).toBe(
        `import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { take } from 'rxjs';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslocoService) {
    this.translate.setDefaultLang('en');
    this.translate.setActiveLang('en');
    const hello = this.translate.translate('app.hello');
    this.translate.selectTranslate('app.title').pipe(take(1)).subscribe((v) => console.log(v));
    this.translate.selectTranslate('app.stream').subscribe();
    const lang = this.translate.getActiveLang();
    this.translate.langChanges$.subscribe(() => {});
    this.translate.set('k', 'v');
  }
}
`,
      );
      expect(printed()).toContain(
        `⚠️ ${path.relative(process.cwd(), path.join(dir, 'app', 'app.component.ts'))}:15: translate.set has no counterpart in the TranslocoService, migrate it by hand`,
      );
    });

    it(`GIVEN a service named like a member and the calls spread over lines
        WHEN the migration runs
        THEN the calls on the injected name are rewritten and the others are left`, () => {
      write(
        'app/home.component.ts',
        `import { Component, OnInit } from '@angular/core';
import { OnDestroy, TranslateService, Inject } from '@ngx-translate/core';

@Component({ selector: 'app-home', templateUrl: './home.component.html' })
export class HomeComponent implements OnInit {
  constructor(
    protected readonly i18n: string,
    public $t: TranslateService,
  ) {}

  ngOnInit() {
    this.$t
      .get('home.title')
      .subscribe();
    const x = this.$t.instant('home.x');
    const y = $t.currentLang;
  }
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/home.component.ts')).toBe(
        `import { Component, OnInit } from '@angular/core';
import { OnDestroy, Inject } from '@ngx-translate/core';
import { TranslocoService } from '@jsverse/transloco';
import { take } from 'rxjs';

@Component({ selector: 'app-home', templateUrl: './home.component.html' })
export class HomeComponent implements OnInit {
  constructor(
    protected readonly i18n: string,
    public $t: TranslocoService,
  ) {}

  ngOnInit() {
    this.$t
      .selectTranslate('home.title').pipe(take(1))
      .subscribe();
    const x = this.$t.translate('home.x');
    const y = $t.getActiveLang();
  }
}
`,
      );
    });

    it(`GIVEN modules importing the TranslateModule next to other symbols or alone
        WHEN the migration runs
        THEN the module is replaced and the other symbols keep their import`, () => {
      write(
        'app/home.module.ts',
        `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, TranslateModule, Other } from '@ngx-translate/core';

@NgModule({
  imports: [CommonModule, TranslateModule.forChild({ isolate: true })],
})
export class HomeModule {}
`,
      );
      write(
        'app/app.module.ts',
        `import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';

@NgModule({
  imports: [TranslateModule.forRoot({ defaultLanguage: 'en' })],
  declarations: [AppComponent],
})
export class AppModule {}
`,
      );
      write(
        'app/shared.module.ts',
        `import { NgModule } from '@angular/core';
import { Foo, TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [TranslateModule],
  exports: [TranslateModule],
})
export class SharedModule {}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/home.module.ts'))
        .toBe(`import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, Other } from '@ngx-translate/core';
import { TranslocoModule } from '@jsverse/transloco';

@NgModule({
  imports: [CommonModule, TranslocoModule],
})
export class HomeModule {}
`);
      expect(read('app/app.module.ts'))
        .toBe(`import { NgModule } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppComponent } from './app.component';

@NgModule({
  imports: [TranslocoModule],
  declarations: [AppComponent],
})
export class AppModule {}
`);
      expect(read('app/shared.module.ts'))
        .toBe(`import { NgModule } from '@angular/core';
import { Foo } from '@ngx-translate/core';
import { TranslocoModule } from '@jsverse/transloco';

@NgModule({
  imports: [TranslocoModule],
  exports: [TranslocoModule],
})
export class SharedModule {}
`);
    });

    it(`GIVEN a spec file
        WHEN the migration runs
        THEN its imports are migrated and the names left are renamed by its own step`, () => {
      write(
        'app/app.component.spec.ts',
        `import { TranslateService } from '@ngx-translate/core';

class Fake {
  constructor(private translate: TranslateService) {}
}
`,
      );
      write(
        'app/home.component.spec.ts',
        `import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('HomeComponent', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
    });
    translate = TestBed.inject(TranslateService);
  });

  it('uses the pipe', () => {
    const pipe: TranslatePipe = null;
    expect(translate.instant('x')).toBe('x');
  });
});
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/app.component.spec.ts'))
        .toBe(`import { TranslocoService } from '@jsverse/transloco';

class Fake {
  constructor(private translate: TranslocoService) {}
}
`);
      expect(read('app/home.component.spec.ts'))
        .toBe(`import { TestBed } from '@angular/core/testing';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

describe('HomeComponent', () => {
  let translate: TranslocoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoModule],
    });
    translate = TestBed.inject(TranslocoService);
  });

  it('uses the pipe', () => {
    const pipe: TranslocoService = null;
    expect(translate.instant('x')).toBe('x');
  });
});
`);
    });
  });

  describe('the service wherever it is injected', () => {
    it(`GIVEN classes and a function taking the TranslateService with inject()
        WHEN the migration runs
        THEN every use of the service is rewritten, whatever its name`, () => {
      write(
        'app/app.ts',
        `import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({ selector: 'app-root', template: '' })
export class App {
  private translate = inject(TranslateService);
  readonly #i18n: TranslateService = inject(TranslateService, { optional: true })!;

  init() {
    this.translate.use('en');
    const a = this.translate.instant('a');
    this.translate.stream('b').subscribe();
    const lang = this.#i18n.currentLang;
    this.#i18n.onLangChange.subscribe();
  }
}

export class Other {
  constructor(private readonly ngx: TranslateService) {}

  init() {
    this.ngx.use('es');
  }
}

export function title() {
  const t = inject(TranslateService);

  return t.instant('title');
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/app.ts'))
        .toBe(`import { Component, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({ selector: 'app-root', template: '' })
export class App {
  private translate = inject(TranslocoService);
  readonly #i18n: TranslocoService = inject(TranslocoService, { optional: true })!;

  init() {
    this.translate.setActiveLang('en');
    const a = this.translate.translate('a');
    this.translate.selectTranslate('b').subscribe();
    const lang = this.#i18n.getActiveLang();
    this.#i18n.langChanges$.subscribe();
  }
}

export class Other {
  constructor(private readonly ngx: TranslocoService) {}

  init() {
    this.ngx.setActiveLang('es');
  }
}

export function title() {
  const t = inject(TranslocoService);

  return t.translate('title');
}
`);
    });

    it(`GIVEN uses of the service without a Transloco counterpart
        WHEN the migration runs
        THEN they are left as they are and printed with their file and line`, () => {
      write(
        'app/app.ts',
        `import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export class App {
  private translate = inject(TranslateService);

  init() {
    this.translate.addLangs(['en', 'es']);
    this.translate.setDefaultLang('en');
    const langs = this.translate.getLangs();
    this.translate.onTranslationChange.subscribe();
  }
}
`,
      );
      process.chdir(dir);

      migrateNgxTranslate({ input: 'app' });

      expect(read('app/app.ts')).toContain(
        `    this.translate.addLangs(['en', 'es']);
    this.translate.setDefaultLang('en');
    const langs = this.translate.getLangs();
    this.translate.onTranslationChange.subscribe();`,
      );
      const file = path.join('app', 'app.ts');

      expect(
        printed().filter((message) => message.startsWith(`⚠️ ${file}`)),
      ).toEqual([
        `⚠️ ${file}:8: translate.addLangs has no counterpart in the TranslocoService, migrate it by hand`,
        `⚠️ ${file}:10: translate.getLangs has no counterpart in the TranslocoService, migrate it by hand`,
        `⚠️ ${file}:11: translate.onTranslationChange has no counterpart in the TranslocoService, migrate it by hand`,
      ]);
    });

    it(`GIVEN a use without a counterpart below a get() call, in a file with no rxjs import
        WHEN the migration runs
        THEN its line is the one of the migrated file, below the import of take`, () => {
      write(
        'app/a.ts',
        `import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export class A {
  private translate = inject(TranslateService);
  a = this.translate.get('a');
  b = this.translate.addLangs(['en']);
}
`,
      );
      process.chdir(dir);

      migrateNgxTranslate({ input: 'app' });

      const lines = read('app/a.ts').split('\n');
      const line = lines.findIndex((text) => text.includes('addLangs')) + 1;

      expect(lines[2]).toBe(`import { take } from 'rxjs';`);
      expect(line).toBe(8);
      expect(printed()).toContain(
        `⚠️ ${path.join('app', 'a.ts')}:8: translate.addLangs has no counterpart in the TranslocoService, migrate it by hand`,
      );
    });

    it(`GIVEN an rxjs import with a type modifier
        WHEN take is added to it
        THEN the modifier is kept`, () => {
      write(
        'app/a.ts',
        `import { inject } from '@angular/core';
import { type OperatorFunction, map } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export class A {
  private translate = inject(TranslateService);
  a = this.translate.get('a');
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.ts')).toContain(
        `import { type OperatorFunction, map, take } from 'rxjs';`,
      );
    });

    it(`GIVEN get() calls next to an rxjs import, an operator import and a take(1) already there
        WHEN the migration runs
        THEN each one emits once, and take is imported once`, () => {
      write(
        'app/a.ts',
        `import { inject } from '@angular/core';
import { map } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export class A {
  private translate = inject(TranslateService);
  a = this.translate.get(['a', 'b'], { n: f(1, ')') }).pipe(map(String));
  b = this.translate.get('b').pipe(take(1));
}
`,
      );
      write(
        'app/b.ts',
        `import { inject } from '@angular/core';
import { take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export class B {
  private translate = inject(TranslateService);
  b = this.translate.get('b');
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.ts')).toBe(`import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

export class A {
  private translate = inject(TranslocoService);
  a = this.translate.selectTranslate(['a', 'b'], { n: f(1, ')') }).pipe(take(1)).pipe(map(String));
  b = this.translate.selectTranslate('b').pipe(take(1));
}
`);
      expect(read('app/b.ts')).toBe(`import { inject } from '@angular/core';
import { take } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';

export class B {
  private translate = inject(TranslocoService);
  b = this.translate.selectTranslate('b').pipe(take(1));
}
`);
    });
  });

  describe('inline templates', () => {
    it(`GIVEN components with inline templates
        WHEN the migration runs
        THEN their templates are migrated like the template files`, () => {
      write(
        'app/feat.ts',
        `import { Component } from '@angular/core';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-feat',
  imports: [TranslatePipe, TranslateDirective],
  template: \`
    <h1>{{ 'FEAT' | translate }}</h1>
    <p [translate]="'P'" [translateParams]="{ a: 1 }"></p>
  \`,
})
export class Feat {}

@Component({ selector: 'app-legacy', template: '<b>{{ "LEGACY" | translate }}</b>' })
export class Legacy {}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/feat.ts'))
        .toBe(`import { Component } from '@angular/core';
import { TranslocoPipe, TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-feat',
  imports: [TranslocoPipe, TranslocoDirective],
  template: \`
    <h1>{{ 'FEAT' | transloco }}</h1>
    <p [transloco]="'P'" [translocoParams]="{ a: 1 }"></p>
  \`,
})
export class Feat {}

@Component({ selector: 'app-legacy', template: '<b>{{ "LEGACY" | transloco }}</b>' })
export class Legacy {}
`);
    });

    it.each([
      ['an interpolation', "template: `<b>{{ 'A' | translate }}</b>${extra}`,"],
      [
        'a concatenation',
        "template: '<b>{{ \\'A\\' | translate }}</b>' + extra,",
      ],
      ['a variable', 'template: shared,'],
      [
        'a translate attribute without a value',
        "template: '<b translate>A</b><i>{{ \\'B\\' | translate }}</i>',",
      ],
    ])(
      `GIVEN a component whose inline template holds %s
       WHEN the migration runs
       THEN the template, the pipe and the module are left, and it is printed with its file and line`,
      (_, template) => {
        const source = `import { Component, inject } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe, TranslateModule.forChild()],
  ${template}
})
export class A {
  translate = inject(TranslateService);
}
`;

        write('app/a.ts', source);
        process.chdir(dir);

        migrateNgxTranslate({ input: 'app' });

        expect(read('app/a.ts')).toBe(
          source
            .replace(
              `import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';`,
              `import { TranslateModule, TranslatePipe } from '@ngx-translate/core';\nimport { TranslocoService } from '@jsverse/transloco';`,
            )
            .replace('inject(TranslateService)', 'inject(TranslocoService)'),
        );
        expect(printed()).toContain(
          `⚠️ ${path.join('app', 'a.ts')}:7: The inline template can't be migrated, its TranslateModule, TranslatePipe and TranslateDirective are left: migrate it by hand`,
        );
      },
    );

    it(`GIVEN a component with a member named template, next to its inline template
        WHEN the migration runs
        THEN only the template of the decorator is read, and the source is migrated`, () => {
      write(
        'app/a.ts',
        `import { Component, Input, TemplateRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({ imports: [TranslatePipe], template: \`{{ 'A' | translate }}\` })
export class A {
  @Input() template: TemplateRef<unknown>;
  options = { template: other };
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.ts'))
        .toBe(`import { Component, Input, TemplateRef } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({ imports: [TranslocoPipe], template: \`{{ 'A' | transloco }}\` })
export class A {
  @Input() template: TemplateRef<unknown>;
  options = { template: other };
}
`);
      expect(
        printed().some((message) => message.includes("inline template can't")),
      ).toBe(false);
    });
  });

  describe('templates the directive can not take', () => {
    it(`GIVEN the translate attribute without a value, holding the key as its content
        WHEN the migration runs
        THEN it is left and printed with its file and line`, () => {
      write(
        'app/a.html',
        `<p title="please translate it">x</p>\n<span translate>menu.item</span>\n`,
      );
      process.chdir(dir);

      migrateNgxTranslate({ input: 'app' });

      expect(read('app/a.html')).toBe(
        `<p title="please translate it">x</p>\n<span translate>menu.item</span>\n`,
      );
      expect(
        printed().filter((message) => message.includes('without a value')),
      ).toEqual([
        `⚠️ ${path.join('app', 'a.html')}:2: The translate attribute without a value isn't migrated, use transloco="key" or the pipe`,
      ]);
    });
  });

  describe('what it must not break', () => {
    it(`GIVEN the translate attribute of HTML, a data attribute and a key holding "translate"
        WHEN the migration runs
        THEN only the directive and the name of the pipe are rewritten`, () => {
      write(
        'app/a.html',
        `<p translate="no" class="notranslate">Brand</p>
<p data-translate="x">X</p>
<p translate="home.translate.title"></p>
<p>{{ 'translate' | translate }}</p>
<p>{{ 'a' | translateX }}</p>
<img [alt]="'menu.translate' | translate" />
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.html'))
        .toBe(`<p translate="no" class="notranslate">Brand</p>
<p data-translate="x">X</p>
<p transloco="home.translate.title"></p>
<p>{{ 'translate' | transloco }}</p>
<p>{{ 'a' | translateX }}</p>
<img [alt]="'menu.translate' | transloco" />
`);
    });

    it(`GIVEN a component importing the pipe, the service and a symbol without a counterpart
        WHEN the migration runs
        THEN each counterpart is imported once from Transloco, the other symbol keeps its import, and the references are renamed`, () => {
      write(
        'app/a.component.ts',
        `import { Component, inject } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({ selector: 'app-a', imports: [TranslatePipe], template: '' })
export class AComponent {
  translate = inject(TranslateService);
  onChange(event: LangChangeEvent) {}
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.component.ts'))
        .toBe(`import { Component, inject } from '@angular/core';
import { LangChangeEvent } from '@ngx-translate/core';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

@Component({ selector: 'app-a', imports: [TranslocoPipe], template: '' })
export class AComponent {
  translate = inject(TranslocoService);
  onChange(event: LangChangeEvent) {}
}
`);
    });

    it(`GIVEN a component injecting the pipe and one importing Transloco already
        WHEN the migration runs
        THEN the injected pipe becomes the service, and nothing is imported twice`, () => {
      write(
        'app/a.component.ts',
        `import { TranslatePipe } from '@ngx-translate/core';

export class AComponent {
  constructor(private pipe: TranslatePipe) {}
}
`,
      );
      write(
        'app/b.component.ts',
        `import { TranslocoService } from '@jsverse/transloco';
import { TranslateService } from '@ngx-translate/core';

export class BComponent {
  constructor(private translate: TranslateService) {}
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/a.component.ts'))
        .toBe(`import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

export class AComponent {
  constructor(private pipe: TranslocoService) {}
}
`);
      expect(read('app/b.component.ts'))
        .toBe(`import { TranslocoService } from '@jsverse/transloco';

export class BComponent {
  constructor(private translate: TranslocoService) {}
}
`);
    });

    it(`GIVEN a spec and a declaration file
        WHEN the migration runs
        THEN the declaration file is left as it is, and the injections and calls of the spec are not rewritten`, () => {
      const declaration = `import { TranslateService } from '@ngx-translate/core';
export declare const t: TranslateService;
`;

      write('app/types.d.ts', declaration);
      write(
        'app/a.spec.ts',
        `class Fake {
  constructor(private translate: TranslocoService) {}
  run() {
    return this.translate.instant('x');
  }
}
`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/types.d.ts')).toBe(declaration);
      expect(read('app/a.spec.ts')).toContain(`this.translate.instant('x')`);
    });
  });

  describe('what it leaves alone', () => {
    it(`GIVEN files of other kinds, declaration files and sources outside the folder
        WHEN the migration runs
        THEN none of them is touched`, () => {
      const html = `<p>{{ 'x' | translate }}</p>\n`;
      const ts = `import { TranslateService } from '@ngx-translate/core';\n`;

      write('app/notes.txt', `translate="x"\n`);
      write('app/styles.css', `.translate { color: red; }\n`);
      write('app/types.json', `{ "translate": "x" }\n`);
      write('other/outside.html', html);
      write('other/outside.ts', ts);
      write('app/inside.html', html);

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(read('app/notes.txt')).toBe(`translate="x"\n`);
      expect(read('app/styles.css')).toBe(`.translate { color: red; }\n`);
      expect(read('app/types.json')).toBe(`{ "translate": "x" }\n`);
      expect(read('other/outside.html')).toBe(html);
      expect(read('other/outside.ts')).toBe(ts);
      expect(read('app/inside.html')).toBe(`<p>{{ 'x' | transloco }}</p>\n`);
    });

    it(`GIVEN files already migrated or with nothing to migrate
        WHEN the migration runs
        THEN they keep their content to the byte`, () => {
      const files = {
        'app/migrated.html': `<p>{{ 'x' | transloco }}</p>\n`,
        'app/empty.html': ``,
        'app/plain.ts': `export const noop = () => {};\n// TranslateService in a comment only\n`,
        'app/crlf.ts': `export const a = 1;\r\nexport const b = 2;\r\n`,
      };

      for (const [file, content] of Object.entries(files)) {
        write(file, content);
      }

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      for (const [file, content] of Object.entries(files)) {
        expect(read(file), file).toBe(content);
      }
    });
  });

  describe('the input folder', () => {
    it(`GIVEN a relative input
        WHEN the migration runs
        THEN it is resolved against the working directory`, () => {
      write('projects/app/a.html', `<p>{{ 'x' | translate }}</p>\n`);
      process.chdir(dir);

      migrateNgxTranslate({ input: './projects/app' });

      expect(read('projects/app/a.html')).toBe(
        `<p>{{ 'x' | transloco }}</p>\n`,
      );
    });

    it(`GIVEN an input whose path holds characters a glob reads as syntax
        WHEN the migration runs
        THEN its files are migrated all the same`, () => {
      write('app [v2] (copy)/a.html', `<p>{{ 'x' | translate }}</p>\n`);
      write(
        'app [v2] (copy)/{b,c}/a.ts',
        `import { TranslateService } from '@ngx-translate/core';\n`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app [v2] (copy)') });

      expect(read('app [v2] (copy)/a.html')).toBe(
        `<p>{{ 'x' | transloco }}</p>\n`,
      );
      expect(read('app [v2] (copy)/{b,c}/a.ts')).toBe(
        `import { TranslocoService } from '@jsverse/transloco';\n`,
      );
    });
  });

  describe('what it prints', () => {
    it(`GIVEN a folder with templates and sources
        WHEN the migration runs
        THEN each step is announced and done, ending with the greeting`, () => {
      write('app/a.html', `<p>{{ 'x' | translate }}</p>\n`);
      write(
        'app/a.ts',
        `import { TranslateService } from '@ngx-translate/core';\n`,
      );
      write(
        'app/a.spec.ts',
        `import { TranslateService } from '@ngx-translate/core';\n`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      expect(printed()).toEqual([
        '\nStarting migration script',
        ...steps('HTML', ['directives', 'pipes']),
        ...steps('TS', [
          'inline templates',
          'modules',
          'imports',
          'constructor injections',
          'service usage',
          'specs',
        ]),
        ...done,
      ]);
    });

    it(`GIVEN a folder with templates alone
        WHEN the migration runs
        THEN every step of the sources warns about the pattern it found no file for`, () => {
      write('app/a.html', `<p>{{ "a" | translate }}</p>\n`);

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      const ts = `⚠️ No files match the pattern: ${path.join(dir, 'app', '/**/*')}.ts`;
      const spec = `⚠️ No files match the pattern: ${path.join(dir, 'app', '/**/*')}spec.ts`;

      expect(printed()).toEqual([
        '\nStarting migration script',
        ...steps('HTML', ['directives', 'pipes']),
        '\nMigrating TS files 📜',
        '⏳ Step 1/6: Migrating inline templates',
        '✅ Step 1/6: Migrating inline templates',
        ts,
        '⏳ Step 2/6: Migrating modules',
        '✅ Step 2/6: Migrating modules',
        ts,
        '⏳ Step 3/6: Migrating imports',
        '✅ Step 3/6: Migrating imports',
        ts,
        '⏳ Step 4/6: Migrating constructor injections',
        '✅ Step 4/6: Migrating constructor injections',
        ts,
        '⏳ Step 5/6: Migrating service usage',
        '✅ Step 5/6: Migrating service usage',
        ts,
        '⏳ Step 6/6: Migrating specs',
        '✅ Step 6/6: Migrating specs',
        spec,
        ...done,
      ]);
    });

    it(`GIVEN a folder with sources alone
        WHEN the migration runs
        THEN only the steps with no file to read warn, the HTML ones and the specs`, () => {
      write(
        'app/a.ts',
        `import { TranslateService } from '@ngx-translate/core';\n`,
      );

      migrateNgxTranslate({ input: path.join(dir, 'app') });

      const html = `⚠️ No files match the pattern: ${path.join(dir, 'app', '/**/*')}.html`;
      const spec = `⚠️ No files match the pattern: ${path.join(dir, 'app', '/**/*')}spec.ts`;

      expect(printed()).toEqual([
        '\nStarting migration script',
        '\nMigrating HTML files 📜',
        '⏳ Step 1/2: Migrating directives',
        '✅ Step 1/2: Migrating directives',
        html,
        '⏳ Step 2/2: Migrating pipes',
        '✅ Step 2/2: Migrating pipes',
        html,
        html,
        '\nMigrating TS files 📜',
        ...[
          'inline templates',
          'modules',
          'imports',
          'constructor injections',
          'service usage',
        ].flatMap((name, index) => [
          `⏳ Step ${index + 1}/6: Migrating ${name}`,
          `✅ Step ${index + 1}/6: Migrating ${name}`,
        ]),
        '⏳ Step 6/6: Migrating specs',
        '✅ Step 6/6: Migrating specs',
        spec,
        ...done,
      ]);
    });

    it(`GIVEN a folder that doesn't exist
        WHEN the migration runs
        THEN it warns for every pattern and migrates nothing, as it always did`, () => {
      migrateNgxTranslate({ input: path.join(dir, 'missing') });

      const warnings = printed().filter((message) => message.startsWith('⚠️'));

      // The pipes warn twice, the rest once
      expect(warnings).toHaveLength(1 + 2 + 1 + 1 + 1 + 1 + 1 + 1);
      expect(
        warnings.every((message) =>
          message.startsWith(
            `⚠️ No files match the pattern: ${path.join(dir, 'missing', '/**/*')}`,
          ),
        ),
      ).toBe(true);
    });

    it(`GIVEN the output is a terminal
        WHEN the migration starts and warns
        THEN the title is underlined and the warnings are yellow`, () => {
      vi.stubEnv('FORCE_COLOR', '1');
      vi.stubEnv('NO_COLOR', undefined);
      vi.stubEnv('NODE_DISABLE_COLORS', undefined);

      migrateNgxTranslate({ input: path.join(dir, 'missing') });

      const [title] = log.mock.calls[0];
      const warning = log.mock.calls.find(([message]) =>
        stripVTControlCharacters(message).startsWith('⚠️'),
      )?.[0];

      expect(title).toContain('\x1b[4m');
      expect(warning).toContain('\x1b[33m');
    });

    it(`GIVEN NO_COLOR is set
        WHEN the migration starts and warns
        THEN nothing printed holds an escape sequence`, () => {
      vi.stubEnv('FORCE_COLOR', undefined);
      vi.stubEnv('NODE_DISABLE_COLORS', undefined);
      vi.stubEnv('NO_COLOR', '1');

      migrateNgxTranslate({ input: path.join(dir, 'missing') });

      for (const [message] of log.mock.calls) {
        expect(message).toBe(stripVTControlCharacters(message));
      }
    });
  });
});
