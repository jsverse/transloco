import {
  getBrowserCultureLang,
  getBrowserLang,
  isBrowser,
  isFunction,
  PersistStorage,
  TranslocoService
} from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import {
  PersistLangConfig,
  TRANSLOCO_PERSIST_LANG_CONFIG,
  TRANSLOCO_PERSIST_LANG_STORAGE
} from './persist-lang.config';
import { Inject, Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService implements OnDestroy {
  private subscription: Subscription = Subscription.EMPTY;
  private storageKey: string;

  constructor(
    private service: TranslocoService,
    @Inject(TRANSLOCO_PERSIST_LANG_STORAGE) private storage: PersistStorage,
    @Inject(TRANSLOCO_PERSIST_LANG_CONFIG) private config: PersistLangConfig
  ) {
    this.storageKey = config.storageKey || 'translocoLang';

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
    return this.service.langChanges$.pipe(skip(1)).subscribe(lang => {
      this.save(lang);
    });
  }

  private init() {
    // We need to first set the cached lang and then listen to changes
    this.setActiveLang();
    this.subscription.unsubscribe();
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
        cachedLang
      });
    }

    if (activeLang) {
      this.service.setActiveLang(activeLang);
    }
  }

  private save(lang: string) {
    if (this.service.config.prodMode === false) {
      console.log(`%c 🍻 Saving ${lang} to storage`, 'background: #fff; color: #2196F3;');
    }
    this.storage.setItem(this.storageKey, lang);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
  
