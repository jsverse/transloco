import { Inject, Injectable } from '@angular/core';
import { isNotBrowser, TranslocoService } from '@ngneat/transloco';
import { skip } from 'rxjs/operators';
import { defaults, PersistLangConfig, TRANSLOCO_PERSIST_LANG_CONFIG } from './persist-lang.config';
import { cookiesStorage } from './cookie-storage';
import { noopStorage } from './noop-storage';

@Injectable({ providedIn: 'root' })
export class TranslocoPersistLangService {
  private mergedConfig: PersistLangConfig;

  constructor(
    private service: TranslocoService,
    @Inject(TRANSLOCO_PERSIST_LANG_CONFIG) private config: PersistLangConfig
  ) {
    this.mergedConfig = { ...defaults, ...(this.config || {}) };
    if (isNotBrowser() === false) {
      this.updateStorageOnLangChange();
      this.mergedConfig.strategy === 'auto' && this.setActiveLang();
    }
  }

  getCachedLang(): string | null {
    if (isNotBrowser() === false) {
      return this.getStorage().getItem(this.storageKey);
    }

    return null;
  }

  clear() {
    this.getStorage().removeItem(this.storageKey);
  }

  private get storageKey() {
    return this.mergedConfig.storageKey;
  }

  private updateStorageOnLangChange() {
    this.service.langChanges$.pipe(skip(1)).subscribe(lang => {
      this.save(lang);
    });
  }

  private setActiveLang() {
    const cached = this.getStorage().getItem(this.storageKey);
    const browserLang = this.service.getBrowserLang();
    const defaultLang = this.service.config.defaultLang;
    const currentLang = cached || browserLang || defaultLang;
    currentLang && this.service.setActiveLang(currentLang);
  }

  private save(lang: string) {
    this.getStorage().setItem(this.storageKey, lang);
  }

  private getStorage() {
    switch (this.mergedConfig.storage) {
      case 'local':
        return localStorage;
      case 'session':
        return sessionStorage;
      case 'cookie':
        return cookiesStorage(this.mergedConfig);
      default:
        return noopStorage;
    }
  }
}
