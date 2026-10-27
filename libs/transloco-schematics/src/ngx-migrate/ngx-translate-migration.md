# ngx-translate Migration script

**Note:** some manual changes might still be needed after the script ran.

`transloco migrate ngx-translate`

## What will be done?

The script will iterate recursively over all your `HTML` and `TS` files and will execute the replacements described below:

### Pipes

The `translate` pipes will be replaced with the `transloco` pipe.

##### Examples:

1. `{{ "hello.world" | translate }}` will be replaced with`{{ "hello.world" | transloco }}`
2. `{{ "hello.world" | translate | anotherPipe | oneMore ... }}` will be replaced with`{{ "hello.world" | transloco | anotherPipe | oneMore ... }}`
3. `{{ "hello" | translate:{name: 'Jhon'} }}` will be replaced with`{{ "hello" | transloco:{name: 'Jhon'} }}`
4. `{{ "hello" | translate:{name: 'Jhon'} | anotherPipe }}` will be replaced with`{{ "hello" | transloco:{name: 'Jhon'} | anotherPipe }}`
5. `<component [header]="'hello.world' | translate"...` will be replaced with `<component [header]="'hello.world' | transloco"...`
6. `<component [header]="'hello.world' | translate | anotherPipe"...` will be replaced with `<component [header]="'hello.world' | transloco | anotherPipe"...`
7. `<component [header]="'hello' | translate:params | anotherPipe"...` will be replaced with `<component [header]="'hello' | transloco:params | anotherPipe"...`

### Directives

The `translate` & `translateParams` directives will be replaced with the matching `transloco` directives. The `translate="yes"` and `translate="no"` attributes of HTML, and attributes such as `data-translate`, are left as they are.

##### Examples:

1. `<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>` will be replaced with`<div [transloco]="'HELLO'" [translocoParams]="{value: 'world'}"></div>`

### Imports

The `TranslateModule`, `TranslateService`, `TranslatePipe` and `TranslateDirective` imports are replaced with their Transloco counterparts, in one `@jsverse/transloco` import per file, and their references in the file are renamed. A symbol the file already imports from `@jsverse/transloco` isn't imported twice, and a symbol without a counterpart keeps its ngx-translate import. A `TranslatePipe` injected in a constructor becomes the `TranslocoService` (see [Constructor Injections](#constructor-injections)).

##### Examples:

1. `import { TranslateService } from '@ngx-translate/core';` will be replaced with `import { TranslocoService } from '@jsverse/transloco';`
2. `import { TranslateModule, TranslateLoader } from '@ngx-translate/core';` will be replaced with
   `import { TranslateLoader } from '@ngx-translate/core';`
   `import { TranslocoModule } from '@jsverse/transloco';`
3. `import { TranslateService } from '@ngx-translate/core';` and `import { TranslatePipe } from '@ngx-translate/core';` will be replaced with `import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';`

### Constructor Injections

The `TranslateService` injections will be replaced with `TranslocoService`.

##### Examples:

1. `constructor(private translate: TranslateService) {` will be replaced with `constructor(private translate: TranslocoService) {`

### Service Usages

1. `translateService.currentLang` will be replaced with `translateService.getActiveLang()`.
2. `translateService.onLangChange` will be replaced with `translateService.langChanges$`.
3. `translateService.use(...)` calls will be replaced with `translateService.setActiveLang(...)`.
4. `translateService.instant(...)` calls will be replaced with `translateService.translate(...)`.
5. `translateService.get(...)` calls will be replaced with `translateService.selectTranslate(...)` and `take(1)` needs to be manually added `translateService.selectTranslate(...).pipe(take(1))` in order to prevent listening to language changes.
6. `translateService.stream(...)` calls will be replaced with `translateService.selectTranslate(...)`.
7. `translateService.set(...)` calls will be replaced with `translateService.setTranslation(...)`.

##### Examples:

1. `const translation = this.translateService.instant('hello')` will be replaced with `const translation = this.translateService.translate('hello')`

##### Manual Replacements

1. `getBrowserLang()` - In Transloco it's a pure function that needs to be imported.
2. `getBrowserCultureLang()` - In Transloco it's a pure function that needs to be imported.
3. `currentLoader` - No equivalent in Transloco.
4. `addLangs(...)` - No equivalent in Transloco.
5. `getLangs(...)` - No equivalent in Transloco.
6. `reloadLang(...)` - No equivalent in Transloco.
7. `resetLang(...)` - No equivalent in Transloco.

### Modules

`TranslateModule` & `TranslateModule.forChild(...)` & `TranslateModule.forRoot(...)` will be replaced with `TranslocoModule`

##### Examples:

1. `TranslateModule.forChild({ loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] } })` will be replaced with `TranslocoModule`

### Specs

The [Imports](#imports) and [Modules](#modules) of the spec files are migrated, and the `TranslateService` and `TranslatePipe` left in them are replaced with `TranslocoService`. Their injections and service calls are left as they are.

Declaration files (`*.d.ts`), and the `node_modules`, `dist`, `out-tsc`, `coverage`, `.angular`, `.nx` and hidden folders below the input, are left out.

### Issues

If you encounter any issues with the migration script please open a github issue so we can resolve them and make a better experience for all.
