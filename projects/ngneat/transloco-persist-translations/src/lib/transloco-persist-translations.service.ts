import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { Observable, from, of } from 'rxjs';
import { map, take, tap, switchMap, filter } from 'rxjs/operators';
import { isObject, isString } from '../../../transloco/src/lib/helpers';
import { now, observify } from './helpers';
import { defaultConfig, TranslocoPersistTranslationsConfig } from './transloco-persist-translations.config';
import { TranslocoStorage } from './transloco.storage';

const getTimestampKey = key => `${key}/timestamp`;

export function translocoPersistTranslationsFactory(
  loader: TranslocoLoader,
  storage: TranslocoStorage,
  config: TranslocoPersistTranslationsConfig = {}
): TranslocoLoader {
  const mergedConfig = { ...defaultConfig, ...config };
  return new TranslocoPersistTranslations(loader, storage, mergedConfig);
}

export class TranslocoPersistTranslations implements TranslocoLoader {
  constructor(
    private loader: TranslocoLoader,
    private storage: TranslocoStorage,
    private config: TranslocoPersistTranslationsConfig
  ) {
    this.clearCurrentStorage();
  }

  getTranslation(lang: string): Observable<Translation> {
    const storageKey = this.config.storageKey;
    return this.getCached(storageKey).pipe(
      switchMap(translations =>
        translations && translations[lang]
          ? of(translations[lang])
          : from(this.loader.getTranslation(lang)).pipe(
              tap(translation => this.setCache(storageKey, lang, translation))
            )
      )
    );
  }

  clearCache() {
    this.clearTimestamp(this.config.storageKey);
    this.clearTranslations();
  }

  private getCached(key: string): Observable<Translation | null> {
    return observify(this.storage.getItem(key)).pipe(
      map(item => (item ? this.decode<Translation>(key, item) : null)),
      take(1)
    );
  }

  private setCache(key: string, lang: string, translation: Translation) {
    this.getCached(key).subscribe(cachedTranslations => {
      const translations = cachedTranslations || {};
      translations[lang] = translation;
      this.setTimestamp(key);
      this.storage.setItem(key, this.encode(translations));
    });
  }

  private encode(value: any): string {
    return JSON.stringify(value);
  }

  private decode<T>(key: string, item: any): T | null {
    if (isObject(item)) {
      return item;
    } else if (isString(item)) {
      try {
        return JSON.parse(item);
      } catch (e) {
        console.error(`storage key: ${key} is not serializable`);
        return null;
      }
    }
    return null;
  }

  private setTimestamp(key: string): void {
    this.storage.setItem(getTimestampKey(key), now());
  }

  private getTimestamp(key: string): Observable<number> {
    return observify(this.storage.getItem(getTimestampKey(key))).pipe(map((time: string) => parseInt(time)));
  }

  private clearTimestamp(key: string): void {
    this.storage.removeItem(getTimestampKey(key));
  }

  private clearTranslations(): void {
    this.storage.removeItem(this.config.storageKey);
  }

  private clearCurrentStorage() {
    const storageKey = this.config.storageKey;
    this.getTimestamp(storageKey)
      .pipe(
        filter(time => !!time),
        tap(time => {
          const isExpired = now() - time >= this.config.ttl;
          if (isExpired) {
            this.storage.removeItem(storageKey);
          }
        })
      )
      .subscribe();
  }
}
