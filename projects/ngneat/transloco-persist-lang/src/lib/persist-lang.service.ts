import {
  getBrowserCultureLang,
  getBrowserLang,
  isBrowser,
  isFunction,
  PersistStorage,
  TranslocoService
} from '@ngneat/transloco';
import { skip } from 'rxjs/operators';
import {
  PersistLangConfig,
  TRANSLOCO_PERSIST_LANG_CONFIG,
  TRANSLOCO_PERSIST_LANG_STORAGE
} from './persist-lang.config';
import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService {
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

  private updateStorageOnLangChange() {
    this.service.langChanges$.pipe(skip(1)).subscribe(lang => {
      console.log(lang);

      this.save(lang);
    });
  }

  private init() {
    // We need to first set the cached lang and then listen to changes
    this.setActiveLang();
    this.updateStorageOnLangChange();
  }

  private setActiveLang() {
    const cachedLang = this.storage.getItem(this.storageKey);
    const browserLang = getBrowserLang();
    const cultureLang = getBrowserCultureLang();
    const defaultLang = this.service.config.defaultLang;
    const activeLang = isFunction(this.config.getLangFn)
      ? this.config.getLangFn({
          browserLang,
          defaultLang,
          cultureLang,
          cachedLang
        })
      : cachedLang || defaultLang;

    activeLang && this.service.setActiveLang(activeLang);
  }

  private save(lang: string) {
    console.log(`%c 🍻 Saving ${lang} to storage`, 'background: #fff; color: #2196F3;');
    this.storage.setItem(this.storageKey, lang);
  }
}
