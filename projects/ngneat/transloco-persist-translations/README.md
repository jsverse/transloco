# TranslocoPersistTranslations

A persisting translations cache plugin for Transloco.

## Installation

```
npm install @ngneat/transloco-persist-translations
```

##Usage
To use the cache, simply provide it as your transloco loader, while passing `translocoPersistTranslationsFactory` you'r original loader and a storage class.

```typescript
// app.module
import {TranslocoModule, TRANSLOCO_LOADER, TranslocoLoader} from '@ngneat/transloco';
import {translocoPersistTranslationsFactory} from '@ngneat/transloco-persist-translations';


export function translocoLoaderFactory(loader: TranslocoLoader) {
  return translocoPersistTranslationsFactory(loader, localStorage);
}

@NgModule({
  imports: [TranslocoModule],
  providers: [
    HttpLoader,
    {
      provide: TRANSLOCO_LOADER,
      deps: [HttpLoader],
      useFactory: translocoLoaderFactory
    }
  ],
  ...
})
export class AppModule {}

```

### Configuration

`translocoPersistTranslationsFactory` can also receive a configuration object with a default values as it's 3rd parameter:

```typescript
config: TranslocoPersistTranslationsConfig = {
  ttl: 86400, // One day
  storageKey: '@transloco/translations'
};
```

- `ttl`: How long the cache should live in seconds.
- `storageKey`: The key to be used to save the translations data.

### Clear Storage

The storage cleanup is done automatically once the `ttl` is passed, but it could also can be done manually by calling `clearCache` method from the cache service:

```typescript
export class AppComponent {
  constructor(@Inject(TRANSLOCO_LOADER) private loader: TranslocoPersistTranslations) {}

  clearTranslationsCache() {
    this.loader.clearCache();
  }
}
```
