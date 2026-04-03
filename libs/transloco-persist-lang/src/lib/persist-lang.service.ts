import {
  inject,
  Injectable,
  Injector,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
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
  TRANSLOCO_PERSIST_LANG_CONFIG,
  TRANSLOCO_PERSIST_LANG_STORAGE,
} from './persist-lang.config';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService implements OnDestroy {
  private injector = inject(Injector);
  private service = inject(TranslocoService);
  private storage = inject(TRANSLOCO_PERSIST_LANG_STORAGE);
  private config = inject(TRANSLOCO_PERSIST_LANG_CONFIG);

  private subscription: Subscription | null = null;
  private storageKey = this.config.storageKey || 'translocoLang';

  constructor() {
    // Prefer `ngServerMode` (Angular v17+) for SSR detection, falling back to `isPlatformServer` for
    // older Angular versions and MFE scenarios where `ngServerMode` may not be available.
    // This lets bundlers tree-shake `isPlatformServer` and `PLATFORM_ID` when `ngServerMode` is always defined.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(inject(PLATFORM_ID))
    ) {
      return;
    }

    this.init();
  }

  getCachedLang(): string | null {
    // See SSR guard in the constructor.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.injector.get(PLATFORM_ID))
    ) {
      return null;
    } else {
      return this.storage.getItem(this.storageKey);
    }
  }

  clear() {
    // See SSR guard in the constructor.
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.injector.get(PLATFORM_ID))
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
