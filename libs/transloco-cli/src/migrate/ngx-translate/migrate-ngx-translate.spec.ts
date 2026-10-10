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
<p [translate]="'app.subtitle'" [translocoParams]="{ name: user }"></p>
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
        `<p>{{ 'crlf.a' | transloco }}</p>\r\n<p [translate]="'crlf.b'"></p>\r\n`,
      );
    });
  });

  describe('sources', () => {
    it(`GIVEN a component injecting the TranslateService
        WHEN the migration runs
        THEN the import, the injection and every use of the service are rewritten`, () => {
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

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslocoService) {
    this.translate.setDefaultLang('en');
    this.translate.setActiveLang('en');
    const hello = this.translate.translate('app.hello');
    this.translate.selectTranslate('app.title').subscribe((v) => console.log(v));
    this.translate.selectTranslate('app.stream').subscribe();
    const lang = this.translate.getActiveLang();
    this.translate.langChanges$.subscribe(() => {});
    this.translate.setTranslation('k', 'v');
  }
}
`,
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

@Component({ selector: 'app-home', templateUrl: './home.component.html' })
export class HomeComponent implements OnInit {
  constructor(
    protected readonly i18n: string,
    public $t: TranslocoService,
  ) {}

  ngOnInit() {
    this.$t
      .selectTranslate('home.title')
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
import { Foo} from '@ngx-translate/core';
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
        THEN it goes through the steps of the other sources as well as through its own, as before`, () => {
      // The steps were written to leave the specs out of the first four. The
      // pattern that excluded them never reached the glob, so they take part.
      // This pins what the schematic did, it isn't a promise.
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
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';

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
          'modules',
          'service imports',
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
        '⏳ Step 1/5: Migrating modules',
        '✅ Step 1/5: Migrating modules',
        ts,
        ts,
        ts,
        '⏳ Step 2/5: Migrating service imports',
        '✅ Step 2/5: Migrating service imports',
        ts,
        ts,
        ts,
        '⏳ Step 3/5: Migrating constructor injections',
        '✅ Step 3/5: Migrating constructor injections',
        ts,
        '⏳ Step 4/5: Migrating service usage',
        '✅ Step 4/5: Migrating service usage',
        ts,
        '⏳ Step 5/5: Migrating specs',
        '✅ Step 5/5: Migrating specs',
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
          'modules',
          'service imports',
          'constructor injections',
          'service usage',
        ].flatMap((name, index) => [
          `⏳ Step ${index + 1}/5: Migrating ${name}`,
          `✅ Step ${index + 1}/5: Migrating ${name}`,
        ]),
        '⏳ Step 5/5: Migrating specs',
        '✅ Step 5/5: Migrating specs',
        spec,
        ...done,
      ]);
    });

    it(`GIVEN a folder that doesn't exist
        WHEN the migration runs
        THEN it warns for every pattern and migrates nothing, as it always did`, () => {
      migrateNgxTranslate({ input: path.join(dir, 'missing') });

      const warnings = printed().filter((message) => message.startsWith('⚠️'));

      // The pipes warn twice, the modules and the service imports three times, the rest once
      expect(warnings).toHaveLength(1 + 2 + 3 + 3 + 1 + 1 + 1);
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
