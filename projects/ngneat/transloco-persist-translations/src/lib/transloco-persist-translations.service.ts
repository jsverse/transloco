import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { Observable, from, of } from 'rxjs';
import { map, take, tap, switchMap } from 'rxjs/operators';
import { isObject, isString, now, observify } from './helpers';
import { defaultConfig, TranslocoPersistTranslationsConfig } from './transloco-persist-translations.config';
import { TranslocoPersistTranslationsTypes } from './transloco-persist-translations.types';

const getTimestampKey = key => `${key}/timestamp`;

export function translocoPersistTranslationsFactory(
  handler: TranslocoPersistTranslationsTypes,
  loader: TranslocoLoader,
  config: TranslocoPersistTranslationsConfig = {}
): TranslocoLoader {
  const mergedConfig = { ...defaultConfig, ...config };
  return new TranslocoPersistTranslations(mergedConfig, handler, loader);
}

export class TranslocoPersistTranslations implements TranslocoLoader {
  constructor(
    private config: TranslocoPersistTranslationsConfig,
    private handler: TranslocoPersistTranslationsTypes,
    private loader: TranslocoLoader
  ) {
    this.clearOldStorage();
  }

  public getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    const storageKey = this.config.storageKey;
    return this.getCache(storageKey).pipe(
      switchMap(translations =>
        translations && translations[lang]
          ? of(translations[lang])
          : from(this.loader.getTranslation(lang)).pipe(
              tap(translation => this.setCache(storageKey, lang, translation))
            )
      )
    );
  }

  private getCache(key: string): Observable<Translation | null> | null {
    return observify(this.handler.getItem(key)).pipe(
      map(item => (item ? this.decode<Translation>(key, item) : null)),
      take(1)
    );
  }

  private setCache(key: string, lang: string, translation: Translation) {
    this.setTimestamp(key);
    this.getCache(key).subscribe(translations => {
      const toSave = translations || {};
      toSave[lang] = translation;
      this.handler.setItem(key, this.encode(toSave));
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
    this.handler.setItem(getTimestampKey(key), now());
  }

  private getTimestamp(key: string): Observable<number> {
    return observify(this.handler.getItem(getTimestampKey(key))).pipe(map((time: string) => parseInt(time)));
  }

  private clearOldStorage() {
    const storageKey = this.config.storageKey;
    this.getTimestamp(storageKey)
      .pipe(
        tap(time => {
          if (time && now() - time > this.config.lifeTime) {
            this.handler.removeItem(storageKey);
          }
        })
      )
      .subscribe();
  }
}
