# Ngx-Translate Migration script

**Note:** some manual changes might still be needed after the script ran.

## What will be done?

The script will iterate recursively over all your `HTML` and `TS` files (spec files excluded) and will execute the replacements described below.  

### Pipe  
The `translate` pipe will be replaced with the `transloco` pipe.

##### Examples:

1. `{{ "hello.world | translate }}"` will be replaced with`{{ "hello.world" | transloco }}"`
2. `<component [header]="'hello.world' | translate"...` will be replaced with `<component [header]="'hello.world' | transloco"...`

### Directives  
The `translate` & `translateParams` directives will be replaced with the matching `transloco` directives.

##### Examples:

1. `<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>` will be replaced with`<div [transloco]="'HELLO'" [translocoParams]="{value: 'world'}"></div>`

### Import  
The `TranslateService` import will be replaced with `TranslocoService`.

##### Examples:

1. `import {TranslateService} from '@ngx-translate/core';` will be replaced with `import { TranslocoService } from '@ngneat/transloco';`
2. `import {TranslateModule, TranslateLoader} from '@ngx-translate/core';` will be replaced with  
    `import {TranslateLoader} from '@ngx-translate/core';`
   `import { TranslocoService } from '@ngneat/transloco';`

### Constructor Injection  
The `TranslateService` injection will be replaced with `TranslocoService`.

##### Examples:

1. `constructor(private translate: TranslateService) {` will be replaced with `constructor(private translate: TranslocoService) {`

### Instant Translations  
The `translateService.instant(...)` calls will be replaced with `translateService.translate(...)`.

##### Examples:

1. `const translation = this.translateService.instant('hello')` will be replaced with `const translation = this.translateService.translate('hello')`

### Module  
`TranslateModule` & `TranslateModule.forChild(...)` & `TranslateModule.forRoot(...)` will be replaced with `TranslocoModule`

##### Examples:

1. `TranslateModule.forChild({ loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] } })` will be replaced with `TranslocoModule`
