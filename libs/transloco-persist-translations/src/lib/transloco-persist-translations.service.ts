import {
  isObject,
  isString,
  Translation,
  TranslocoLoader,
} from '@ngneat/transloco';
import { from, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { inject, Injectable, OnDestroy } from '@angular/core';

import { observify } from './helpers';
import {
  TRANSLOCO_PERSIST_TRANSLATIONS_LOADER,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG,
} from './transloco-persist-translations.config';

export function getTimestampKey(key: string) {
  return `${key}/timestamp`;
}

@Injectable()
export class TranslocoPersistTranslations
  implements TranslocoLoader, OnDestroy
{
  private loader = inject(TRANSLOCO_PERSIST_TRANSLATIONS_LOADER);
  private storage = inject(TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE);
  private config = inject(TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG);

  private subscription: Subscription | null =
    this.clearCurrentStorage().subscribe();
  private cache: Translation | null = null;

  getTranslation(lang: string): Observable<Translation> {
    const storageKey = this.config.storageKey;

    return this.getCached(storageKey).pipe(
      switchMap((translations) => {
        if (translations?.[lang]) {
          return of(translations[lang]);
        }

        return from(this.loader.getTranslation(lang)).pipe(
          tap((translation) => this.setCache(storageKey, lang, translation))
        );
      })
    );
  }

  clearCache() {
    this.clearTimestamp(this.config.storageKey);
    this.clearTranslations();
    this.cache = null;
  }

  private getCached(key: string): Observable<Translation | null> {
    return this.cache
      ? of(this.cache)
      : observify(this.storage.getItem(key)).pipe(
          map((item) => {
            return item ? this.decode<Translation>(key, item) : null;
          }),
          tap((item) => {
            this.cache = item;
          }),
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

  private encode(value: unknown): string {
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
    this.storage.setItem(getTimestampKey(key), Date.now());
  }

  private getTimestamp(key: string): Observable<number> {
    return observify(this.storage.getItem(getTimestampKey(key))).pipe(
      map(parseInt)
    );
  }

  private clearTimestamp(key: string): void {
    this.storage.removeItem(getTimestampKey(key));
  }

  private clearTranslations(): void {
    this.storage.removeItem(this.config.storageKey);
  }

  private clearCurrentStorage(): Observable<number> {
    const storageKey = this.config.storageKey;

    return this.getTimestamp(storageKey).pipe(
      filter(Boolean),
      tap((time) => {
        const isExpired = Date.now() - time >= this.config.ttl;
        if (isExpired) {
          this.storage.removeItem(storageKey);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
