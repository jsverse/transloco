# Persist Language

This plugin provides the functionality of persisting the active language to the provided storage.

### Installation

```
npm i @ngneat/transloco-persist-lang
```

### Usage

Import the `TranslocoPersistLangModule` module into the `AppModule`, and provide the storage you would like to use:

```ts
import { TRANSLOCO_PERSIST_LANG_STORAGE, TranslocoPersistLangModule } from '@ngneat/transloco-persist-lang';

@NgModule({
  imports: [
    TranslocoModule,
    TranslocoPersistLangModule.init({
      storage: {
        provide: TRANSLOCO_PERSIST_LANG_STORAGE,
        useValue: localStorage
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

When the user changes the current language, the plugin will keep it in the provided storage and set it as active when the user returns to the application.

By default, the plugin will use the cached language if available otherwise it will use the default language provided in the config. You can always change this behavior by providing a `getLangFn` option:

```ts
import { TRANSLOCO_PERSIST_LANG_STORAGE, TranslocoPersistLangModule } from '@ngneat/transloco-persist-lang';

export function getLangFn({ cachedLang, browserLang, cultureLang, defaultLang }) {
  return yourLogic;
}

@NgModule({
  imports: [
    TranslocoModule,
    TranslocoPersistLangModule.init({
      getLangFn,
      storage: {
        provide: TRANSLOCO_PERSIST_LANG_STORAGE,
        useValue: localStorage
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

The plugin also provides a `cookiesStorage` function that you can use to save the language in a cookie. (SSR advantage)

```ts
import {
  TRANSLOCO_PERSIST_LANG_STORAGE
  TranslocoPersistLangModule,
  cookiesStorage
} from '@ngneat/transloco-persist-lang';

@NgModule({
  imports: [
    TranslocoModule,
    TranslocoPersistLangModule.init({
      storage: {
        provide: TRANSLOCO_PERSIST_LANG_STORAGE,
        useValue: cookiesStorage()
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```
