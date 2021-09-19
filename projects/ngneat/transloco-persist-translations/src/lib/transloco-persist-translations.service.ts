import { isObject, isString, Translation, TranslocoLoader } from '@ngneat/transloco';
import { from, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { now, observify } from './helpers';
import {
  defaultConfig,
  PERSIST_TRANSLATIONS_CONFIG,
  PERSIST_TRANSLATIONS_LOADER,
  PERSIST_TRANSLATIONS_STORAGE,
  TranslocoPersistTranslationsConfig
} from './transloco-persist-translations.config';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { MaybeAsyncStorage } from './transloco.storage';

const getTimestampKey = key => `${key}/timestamp`;

@Injectable()
export class TranslocoPersistTranslations implements TranslocoLoader, OnDestroy {
  private subscription: Subscription;
  private merged: TranslocoPersistTranslationsConfig;
  private cache: Translation | null = null;

  constructor(
    @Inject(PERSIST_TRANSLATIONS_LOADER) private loader: TranslocoLoader,
    @Inject(PERSIST_TRANSLATIONS_STORAGE) private storage: MaybeAsyncStorage,
    @Inject(PERSIST_TRANSLATIONS_CONFIG) private config: TranslocoPersistTranslationsConfig
  ) {
    this.merged = { ...defaultConfig, ...(config || {}) };
    this.subscription = this.clearCurrentStorage().subscribe();
  }

  getTranslation(lang: string): Observable<Translation> {
    const storageKey = this.merged.storageKey;
    return this.getCached(storageKey).pipe(
      switchMap(translations => {
        if (translations && translations[lang]) {
          return of(translations[lang]);
        }

        return from(this.loader.getTranslation(lang)).pipe(
          tap(translation => this.setCache(storageKey, lang, translation))
        );
      })
    );
  }

  clearCache() {
    this.clearTimestamp(this.merged.storageKey);
    this.clearTranslations();
    this.cache = null;
  }

  private getCached(key: string): Observable<Translation | null> {
    return this.cache
      ? of(this.cache)
      : observify(this.storage.getItem(key)).pipe(
          map(item => (item ? this.decode<Translation>(key, item) : null)),
          tap(item => (this.cache = item)),
          take(1)
        );
  }

  private setCache(key: string, lang: string, translation: Translation) {
    const translations = this.cache || {};
    translations[lang] = translation;
    this.setTimestamp(key);
    this.storage.setItem(key, this.encode(translations));
    this.cache = translations;
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
    this.storage.removeItem(this.merged.storageKey);
  }

  private clearCurrentStorage(): Observable<any> {
    const storageKey = this.merged.storageKey;
    return this.getTimestamp(storageKey).pipe(
      filter(time => !!time),
      tap(time => {
        const isExpired = now() - time >= this.merged.ttl;
        if (isExpired) {
          this.storage.removeItem(storageKey);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
