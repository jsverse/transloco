import {
  getBrowserCultureLang,
  getBrowserLang,
  isBrowser,
  isFunction,
  TranslocoService,
} from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { inject, Injectable, OnDestroy } from '@angular/core';

import {
  TRANSLOCO_PERSIST_LANG_CONFIG,
  TRANSLOCO_PERSIST_LANG_STORAGE,
} from './persist-lang.config';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService implements OnDestroy {
  private service = inject(TranslocoService);
  private storage = inject(TRANSLOCO_PERSIST_LANG_STORAGE);
  private config = inject(TRANSLOCO_PERSIST_LANG_CONFIG);

  private subscription: Subscription | null = null;
  private storageKey = this.config.storageKey || 'translocoLang';

  constructor() {
    if (isBrowser()) {
      this.init();
    }
  }

  getCachedLang(): string | null {
    return isBrowser() ? this.storage.getItem(this.storageKey) : null;
  }

  clear() {
    isBrowser() && this.storage.removeItem(this.storageKey);
  }

  private updateStorageOnLangChange(): Subscription {
    return this.service.langChanges$.pipe(skip(1)).subscribe((lang) => {
      this.save(lang);
    });
  }

  private init() {
    // We need to first set the cached lang and then listen to changes
    this.setActiveLang();
    this.subscription?.unsubscribe();
    this.subscription = this.updateStorageOnLangChange();
  }

  private setActiveLang() {
    const cachedLang = this.storage.getItem(this.storageKey);
    const defaultLang = this.service.config.defaultLang;
    let activeLang = cachedLang || defaultLang;

    if (isFunction(this.config.getLangFn)) {
      const browserLang = getBrowserLang();
      const cultureLang = getBrowserCultureLang();
      activeLang = this.config.getLangFn({
        browserLang,
        defaultLang,
        cultureLang,
        cachedLang,
      });
    }

    if (activeLang) {
      this.service.setActiveLang(activeLang);
    }
  }

  private save(lang: string) {
    if (!this.service.config.prodMode) {
      console.log(
        `%c 🍻 Saving ${lang} to storage`,
        'background: #fff; color: #2196F3;',
      );
    }
    this.storage.setItem(this.storageKey, lang);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
