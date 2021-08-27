import { fakeAsync, tick } from '@angular/core/testing';
import { TranslocoLoader } from '@ngneat/transloco';
import { of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { Mock } from 'ts-mocks';
import { defaultConfig } from './transloco-persist-translations.config';
import { TranslocoPersistTranslations } from './transloco-persist-translations.service';
import { MaybeAsyncStorage } from './transloco.storage';

describe('TranslocoPersistTranslations', () => {
  let service: TranslocoPersistTranslations;
  let loader: TranslocoLoader;
  const translationsMock = { title: 'title' };

  describe('Sync Storage', () => {
    let storageMock: MaybeAsyncStorage;

    function createStorageMock() {
      return new (class Storage implements MaybeAsyncStorage {
        storage: Record<string, any> = {};
        getItem(key: string) {
          return this.storage[key];
        }

        setItem(key: string, value: any): void {
          this.storage[key] = value + '';
        }

        removeItem(key: string): void {
          delete this.storage[key];
        }
      })();
    }

    function createLoaderMock(translations = translationsMock) {
      return new Mock<TranslocoLoader>({
        getTranslation: () => of(translations),
      }).Object;
    }

    function setup(config = defaultConfig, translations = translationsMock) {
      storageMock = createStorageMock();
      loader = createLoaderMock(translations);
      service = new TranslocoPersistTranslations(loader, storageMock, config);
    }

    it('should save the translations object in the storage', () => {
      setup();
      service.getTranslation('en').subscribe();
      const expected = JSON.stringify({ en: translationsMock });
      expect(storageMock.getItem(defaultConfig.storageKey)).toEqual(expected);
    });

    it('should not call loader after caching translations', () => {
      setup();
      service.getTranslation('en').subscribe();
      service.getTranslation('en').subscribe();
      expect(loader.getTranslation).toHaveBeenCalledTimes(1);
    });

    it('should call loader after clearing translations', () => {
      setup();
      service.getTranslation('en').subscribe();
      service.clearCache();
      service.getTranslation('en').subscribe();
      expect(loader.getTranslation).toHaveBeenCalledTimes(2);
    });

    it('should call loader foreach lang', () => {
      setup();
      service.getTranslation('en').subscribe();
      service.getTranslation('es').subscribe();
      expect(loader.getTranslation).toHaveBeenCalledTimes(2);
    });

    it('should save translations for multiple langs', () => {
      setup();
      service.getTranslation('en').subscribe();
      service.getTranslation('es').subscribe();
      const expected = JSON.stringify({
        en: translationsMock,
        es: translationsMock,
      });
      expect(storageMock.getItem(defaultConfig.storageKey)).toEqual(expected);
    });

    it('should clear translations with ttl older then what specified in the config', fakeAsync(() => {
      storageMock = createStorageMock();
      loader = createLoaderMock(translationsMock);
      spyOn(storageMock, 'removeItem').and.callThrough();

      service = new TranslocoPersistTranslations(loader, storageMock, {
        ...defaultConfig,
        ttl: 10,
      });
      service.getTranslation('en').subscribe();
      tick(10);
      service = new TranslocoPersistTranslations(loader, storageMock, {
        ...defaultConfig,
        ttl: 10,
      });

      expect(storageMock.removeItem).toHaveBeenCalledWith(
        defaultConfig.storageKey
      );
    }));

    it('should clear translations', () => {
      setup();
      spyOn(storageMock, 'removeItem').and.callThrough();
      service.clearCache();
      expect(storageMock.removeItem).toHaveBeenCalledWith(
        defaultConfig.storageKey
      );
      expect(storageMock.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Async Storage', () => {
    let storageMock: MaybeAsyncStorage;
    const DELAY = 200;

    function createStorageMock() {
      return new (class Storage implements MaybeAsyncStorage {
        storage: Record<string, any> = {};
        public getItem(key: string) {
          return timer(DELAY).pipe(mapTo(this.storage[key]));
        }

        setItem(key: string, value: any): void {
          timer(DELAY).subscribe(() => {
            this.storage[key] = value + '';
          });
        }

        removeItem(key: string): void {
          timer(DELAY).subscribe(() => {
            delete this.storage[key];
          });
        }
      })();
    }

    function createLoaderMock(translations = translationsMock) {
      return new Mock<TranslocoLoader>({
        getTranslation: () => timer(DELAY).pipe(mapTo(translations)),
      }).Object;
    }

    function setup(config = defaultConfig, translations = translationsMock) {
      storageMock = createStorageMock();
      loader = createLoaderMock(translations);
      service = new TranslocoPersistTranslations(loader, storageMock, config);
    }

    it('should save the translations asynchronously in the storage', fakeAsync(() => {
      setup();
      tick(DELAY);
      spyOn(storageMock, 'setItem').and.callThrough();
      let res;
      service.getTranslation('en').subscribe((translations) => {
        res = translations;
      });
      tick(DELAY * 4);
      expect(storageMock.setItem).toHaveBeenCalledWith(
        defaultConfig.storageKey,
        JSON.stringify({ en: res })
      );
    }));

    it('should not call loader after caching translations', fakeAsync(() => {
      setup();
      tick(DELAY);
      service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      expect(loader.getTranslation).toHaveBeenCalledTimes(1);
    }));

    it('should call loader after clearing translations', fakeAsync(() => {
      setup();
      tick(DELAY);
      service.getTranslation('en').subscribe();
      service.clearCache();
      service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      expect(loader.getTranslation).toHaveBeenCalledTimes(2);
    }));

    it('should call loader foreach lang', fakeAsync(() => {
      setup();
      tick(DELAY);
      service.getTranslation('en').subscribe();
      service.getTranslation('es').subscribe();
      tick(DELAY * 4);
      expect(loader.getTranslation).toHaveBeenCalledTimes(2);
    }));

    it('should not override translations', fakeAsync(() => {
      setup();
      tick(DELAY);
      service.getTranslation('en').subscribe();
      service.getTranslation('es').subscribe();
      tick(DELAY * 4);
      storageMock
        .getItem(defaultConfig.storageKey)
        .subscribe((translations: string) => {
          expect(Object.keys(JSON.parse(translations))).toEqual(['en', 'es']);
        });
      tick(DELAY);
    }));

    it('should add scope and lang to cache', fakeAsync(() => {
      setup();
      tick(DELAY);
      service.getTranslation('en/scope').subscribe();
      service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      storageMock
        .getItem(defaultConfig.storageKey)
        .subscribe((translations: string) => {
          expect(Object.keys(JSON.parse(translations))).toEqual([
            'en/scope',
            'en',
          ]);
        });
      tick(DELAY);
    }));
  });
});
