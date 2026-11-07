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

The `translate` & `translateParams` directives will be replaced with the matching `transloco` directives. The `translate="yes"` and `translate="no"` attributes of HTML, and attributes such as `data-translate`, are left as they are. A `translate` attribute without a value, whose key is the content of the element (`<span translate>KEY</span>`), is left as it is and printed with its file and line: use `transloco="KEY"` or the pipe.

##### Examples:

1. `<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>` will be replaced with`<div [transloco]="'HELLO'" [translocoParams]="{value: 'world'}"></div>`

### Inline templates

The templates written in the `template` of a `@Component()` are migrated like the template files: their pipes and directives are replaced as above. A template the script can't read, a template string with an interpolation (`${...}`), a concatenation, or a variable, is left as it is and printed with its file and line, and that file keeps its `TranslateModule`, `TranslatePipe` and `TranslateDirective` so that its template still compiles. Migrate it by hand.

### Imports

The `TranslateModule`, `TranslateService`, `TranslatePipe` and `TranslateDirective` imports are replaced with their Transloco counterparts, in one `@jsverse/transloco` import per file, and their references in the file are renamed. A symbol the file already imports from `@jsverse/transloco` isn't imported twice, and a symbol without a counterpart keeps its ngx-translate import. A `TranslatePipe` injected in a constructor becomes the `TranslocoService` (see [Injections](#injections)).

##### Examples:

1. `import { TranslateService } from '@ngx-translate/core';` will be replaced with `import { TranslocoService } from '@jsverse/transloco';`
2. `import { TranslateModule, TranslateLoader } from '@ngx-translate/core';` will be replaced with
   `import { TranslateLoader } from '@ngx-translate/core';`
   `import { TranslocoModule } from '@jsverse/transloco';`
3. `import { TranslateService } from '@ngx-translate/core';` and `import { TranslatePipe } from '@ngx-translate/core';` will be replaced with `import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';`

### Injections

The `TranslateService` injections will be replaced with `TranslocoService`, in a constructor or with `inject()`.

##### Examples:

1. `constructor(private translate: TranslateService) {` will be replaced with `constructor(private translate: TranslocoService) {`
2. `private translate = inject(TranslateService);` will be replaced with `private translate = inject(TranslocoService);`

### Service Usages

The calls are replaced on every name the service is injected as, a constructor parameter (`private translate: TranslateService`), a field or a variable given by `inject()` (`#i18n = inject(TranslateService)`, `const t = inject(TranslateService)`).

1. `translateService.currentLang` will be replaced with `translateService.getActiveLang()`.
2. `translateService.onLangChange` will be replaced with `translateService.langChanges$`.
3. `translateService.use(...)` calls will be replaced with `translateService.setActiveLang(...)`.
4. `translateService.instant(...)` calls will be replaced with `translateService.translate(...)`.
5. `translateService.get(...)` calls will be replaced with `translateService.selectTranslate(...).pipe(take(1))`, so that they emit once as before instead of listening to language changes. `take` is added to the `rxjs` import of the file, unless it imports it already.
6. `translateService.stream(...)` calls will be replaced with `translateService.selectTranslate(...)`.

##### Examples:

1. `const translation = this.translateService.instant('hello')` will be replaced with `const translation = this.translateService.translate('hello')`

##### Manual Replacements

These members are left as they are, and each use is printed with its file and line:

1. `getBrowserLang()` - In Transloco it's a pure function that needs to be imported.
2. `getBrowserCultureLang()` - In Transloco it's a pure function that needs to be imported.
3. `getLangs()` and `langs` - `getAvailableLangs()`.
4. `addLangs(...)` - `setAvailableLangs(...)` sets the whole list.
5. `set(key, value, lang)` - `setTranslationKey(key, value, { lang })`, whose third argument is an options object.
6. `currentLoader`, `reloadLang(...)`, `resetLang(...)`, `defaultLang`, `onTranslationChange`, `onDefaultLangChange`, `getParsedResult(...)`, `getStreamOnTranslationChange(...)`, `translations`, `store`, `compiler`, `parser`, `missingTranslationHandler` - No direct equivalent in Transloco.

`getTranslation(...)` and `setTranslation(...)` keep their names, which the `TranslocoService` has too, but take other arguments: check them by hand.

### Modules

`TranslateModule` & `TranslateModule.forChild(...)` & `TranslateModule.forRoot(...)` will be replaced with `TranslocoModule`

##### Examples:

1. `TranslateModule.forChild({ loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] } })` will be replaced with `TranslocoModule`

### Specs

The [Imports](#imports) and [Modules](#modules) of the spec files are migrated, and the `TranslateService` and `TranslatePipe` left in them are replaced with `TranslocoService`. Their injections and service calls are left as they are.

Declaration files (`*.d.ts`), and the `node_modules`, `dist`, `out-tsc`, `coverage`, `.angular`, `.nx` and hidden folders below the input, are left out.

### After the migration

The script rewrites the templates and the sources, a few steps are left to you:

1. Set up Transloco in place of `provideTranslateService()` / `TranslateModule.forRoot()` and the `TranslateHttpLoader`: `provideTransloco()` with your languages and a `TranslocoLoader` that loads your translation files. `ng add @jsverse/transloco` writes both.
2. Import `TranslocoPipe` or `TranslocoDirective` in a standalone component whose template uses them and didn't import the `TranslatePipe` or the `TranslateDirective` before (the script renames the imports it finds).
3. Go through what the script printed: the uses of the service without a counterpart, the `translate` attributes without a value and the inline templates it couldn't read.

### Issues

If you encounter any issues with the migration script please open a github issue so we can resolve them and make a better experience for all.
