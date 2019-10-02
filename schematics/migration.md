# ngx-translate Migration script

**Note:** some manual changes might still be needed after the script ran.

`ng g @ngneat/transloco:migrate`

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

The `translate` & `translateParams` directives will be replaced with the matching `transloco` directives.

##### Examples:

1. `<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>` will be replaced with`<div [transloco]="'HELLO'" [translocoParams]="{value: 'world'}"></div>`

### Imports

The `TranslateService` imports will be replaced with `TranslocoService`.

##### Examples:

1. `import {TranslateService} from '@ngx-translate/core';` will be replaced with `import { TranslocoService } from '@ngneat/transloco';`
2. `import {TranslateModule, TranslateLoader} from '@ngx-translate/core';` will be replaced with  
    `import {TranslateLoader} from '@ngx-translate/core';`
   `import { TranslocoService } from '@ngneat/transloco';`

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

[Imports](#imports), [Modules](#modules) and `TranslateService` will be replaced with `TranslocoService`

### Issues

If you encounter any issues with the migration script please open a github issue so we can resolve them and make a better experience for all.
