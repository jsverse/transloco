# Persist Translations

This plugin provides the functionality of persisting translations to the provided storage.

## Installation

```
npm install @ngneat/transloco-persist-translations
```

## Usage

Import the `TranslocoPersistTranslationsModule` module into the `AppModule`, and provide the storage you would like to use:

```ts
import {
  TranslocoPersistTranslationsModule,
  PERSIST_TRANSLATIONS_STORAGE
} from '@ngneat/transloco-persist-translations';
import { HttpLoader } from './transloco.loader';

@NgModule({
  imports: [
    ...TranslocoModule,
    TranslocoPersistTranslationsModule.init({
      loader: HttpLoader,
      storage: {
        provide: PERSIST_TRANSLATIONS_STORAGE,
        useValue: localStorage
      }
    })
  ]
})
export class AppModule {}
```

You can also use an async storage. For example, let's install [localForage](https://github.com/localForage/localForage) and use `IndexedDB`:

```ts
import {
  TranslocoPersistTranslationsModule,
  PERSIST_TRANSLATIONS_STORAGE
} from '@ngneat/transloco-persist-translations';
import { HttpLoader } from './transloco.loader';
import * as localForage from 'localforage';

localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'Transloco',
  storeName: 'translations'
});

@NgModule({
  imports: [
    ...TranslocoModule,
    TranslocoPersistTranslationsModule.init({
      loader: HttpLoader,
      storage: {
        provide: PERSIST_TRANSLATIONS_STORAGE,
        useValue: localForage
      }
    })
  ]
})
export class AppModule {}
```

### Configuration

`TranslocoPersistTranslationsModule` can also receive the following configuration:

```json
{
  "ttl": 86400,
  "storageKey": "yourKey"
}
```

- `ttl`: How long the cache should live in seconds.
- `storageKey`: The key to be used to save the translations data.

### Clear Storage

The storage cleanup is done automatically once the `ttl` is passed, but it could also can be done manually by calling `clearCache` method from the cache service:

```ts
import { TranslocoPersistTranslations } from '@ngneat/transloco-persist-translations';

export class AppComponent {
  constructor(private loader: TranslocoPersistTranslations) {}

  clearTranslationsCache() {
    this.loader.clearCache();
  }
}
```
