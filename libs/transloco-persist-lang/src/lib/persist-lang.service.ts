import { inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import {
  getBrowserCultureLang,
  getBrowserLang,
  TranslocoService,
} from '@jsverse/transloco';
import { isFunction } from '@jsverse/utils';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';

import {
  injectPersistLangConfig,
  injectPersistLangStorage,
} from './persist-lang.config';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private service = inject(TranslocoService);
  private storage = injectPersistLangStorage();
  private config = injectPersistLangConfig();

  private subscription: Subscription | null = null;
  private storageKey = this.config.storageKey || 'translocoLang';

  constructor() {
    // SSR guard. Prefer `ngServerMode` (defined by the Angular CLI since v17);
    // fall back to `isPlatformServer` for older Angular versions and MFE setups
    // where `ngServerMode` may be missing. When `ngServerMode` is statically
    // `true` the whole `||` folds to `true`, so `isPlatformServer` and the
    // `PLATFORM_ID` read tree-shake out of the server bundle.
    //
    // This condition is intentionally copy-pasted inline into `getCachedLang()`
    // and `clear()` rather than extracted into a getter/helper: a method call is
    // opaque to the minifier, so it could not fold the check to `true` and strip
    // the unreachable `this.init()` / storage code from the server build. Keep
    // the three copies in sync; do not DRY them into a function.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.platformId)
    ) {
      return;
    }

    this.init();
  }

  getCachedLang(): string | null {
    // See the SSR guard in the constructor — kept inline on purpose.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.platformId)
    ) {
      return null;
    } else {
      return this.storage.getItem(this.storageKey);
    }
  }

  clear() {
    // See the SSR guard in the constructor — kept inline on purpose.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.platformId)
    ) {
      return;
    }

    this.storage.removeItem(this.storageKey);
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
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
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
