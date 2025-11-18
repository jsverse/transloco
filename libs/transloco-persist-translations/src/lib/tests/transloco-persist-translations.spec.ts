import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import {
  defaultConfig,
  TRANSLOCO_PERSIST_TRANSLATIONS_LOADER,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG,
} from '../transloco-persist-translations.config';
import {
  getTimestampKey,
  TranslocoPersistTranslations,
} from '../transloco-persist-translations.service';
import {
  provideTranslocoPersistTranslations,
  provideTranslocoPersistTranslationsConfig,
} from '../transloco-persist-translations.providers';
import { MaybeAsyncStorage } from '../transloco.storage';

import {
  createAsyncLoaderMock,
  createAsyncStorageMock,
  createLoaderMock,
  createStorageMock,
} from './mocks';

describe('TranslocoPersistTranslations', () => {
  let spectator: SpectatorService<TranslocoPersistTranslations>;
  const translationsMock = { title: 'title' };

  function getStorageService() {
    return spectator.inject(TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE);
  }

  function getConfig() {
    return spectator.inject(TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG);
  }

  function spyOnGetTranslation() {
    return spyOn(
      spectator.inject(TRANSLOCO_PERSIST_TRANSLATIONS_LOADER),
      'getTranslation',
    ).and.callThrough();
  }

  describe('Sync Storage', () => {
    const serviceFactory = createServiceFactory({
      service: TranslocoPersistTranslations,
      providers: [
        provideTranslocoPersistTranslations({
          loader: createLoaderMock(translationsMock),
          storage: {
            useClass: createStorageMock(),
          },
        }),
      ],
    });

    describe('Default config', () => {
      beforeEach(() => (spectator = serviceFactory()));

      it(`GIVEN translations loaded for 'en'
          WHEN getTranslation is called
          THEN saves translations object to storage`, () => {
        spectator.service.getTranslation('en').subscribe();
        const expected = JSON.stringify({ en: translationsMock });
        const cached = getStorageService().getItem(getConfig().storageKey);
        expect(cached).toEqual(expected);
      });

      it(`GIVEN translations already cached
          WHEN getTranslation is called again for same language
          THEN does not call loader again`, () => {
        const spy = spyOnGetTranslation();
        spectator.service.getTranslation('en').subscribe();
        spectator.service.getTranslation('en').subscribe();
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it(`GIVEN translations cached then cleared
          WHEN getTranslation is called after clearCache
          THEN calls loader again`, () => {
        const spy = spyOnGetTranslation();
        spectator.service.getTranslation('en').subscribe();
        spectator.service.clearCache();
        spectator.service.getTranslation('en').subscribe();
        expect(spy).toHaveBeenCalledTimes(2);
      });

      it(`GIVEN multiple languages requested
          WHEN getTranslation is called for different languages
          THEN calls loader for each language`, () => {
        const spy = spyOnGetTranslation();
        spectator.service.getTranslation('en').subscribe();
        spectator.service.getTranslation('es').subscribe();
        expect(spy).toHaveBeenCalledTimes(2);
      });

      it(`GIVEN multiple languages loaded
          WHEN getTranslation is called for en and es
          THEN saves all translations to storage`, () => {
        spectator.service.getTranslation('en').subscribe();
        spectator.service.getTranslation('es').subscribe();
        const expected = JSON.stringify({
          en: translationsMock,
          es: translationsMock,
        });
        const cached = getStorageService().getItem(getConfig().storageKey);
        expect(cached).toEqual(expected);
      });

      it(`GIVEN translations in cache
          WHEN clearCache is called
          THEN removes translations and timestamp from storage`, () => {
        const spy = spyOn(getStorageService(), 'removeItem').and.callThrough();
        spectator.service.clearCache();
        const { storageKey } = getConfig();
        expect(spy).toHaveBeenCalledWith(getTimestampKey(storageKey));
        expect(spy).toHaveBeenCalledWith(storageKey);
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    function resetService(storageService: MaybeAsyncStorage) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TranslocoPersistTranslations,
          provideTranslocoPersistTranslations({
            loader: createLoaderMock(translationsMock),
            storage: {
              useValue: storageService,
            },
          }),
        ],
      });
    }

    it(`GIVEN translations cached with ttl configured
        WHEN ttl expires and service reinitializes
        THEN clears expired translations from storage`, fakeAsync(() => {
      spectator = serviceFactory({
        providers: [provideTranslocoPersistTranslationsConfig({ ttl: 10 })],
      });
      const storageService = getStorageService();
      const spy = spyOn(storageService, 'removeItem').and.callThrough();
      spectator.service.getTranslation('en').subscribe();
      tick(10);
      resetService(storageService);
      spectator = serviceFactory({
        providers: [provideTranslocoPersistTranslationsConfig({ ttl: 10 })],
      });
      expect(spy).toHaveBeenCalledWith(defaultConfig.storageKey);
    }));
  });

  describe('Async Storage', () => {
    const DELAY = 200;
    const serviceFactory = createServiceFactory({
      service: TranslocoPersistTranslations,
      providers: [
        provideTranslocoPersistTranslations({
          loader: createAsyncLoaderMock(DELAY, translationsMock),
          storage: {
            useClass: createAsyncStorageMock(DELAY),
          },
        }),
      ],
    });

    beforeEach(() => (spectator = serviceFactory()));

    it(`GIVEN async storage configured
        WHEN getTranslation is called
        THEN saves translations asynchronously to storage`, fakeAsync(() => {
      tick(DELAY);
      const spy = spyOn(getStorageService(), 'setItem').and.callThrough();
      let res;
      spectator.service.getTranslation('en').subscribe((translations) => {
        res = translations;
      });
      tick(DELAY * 4);
      expect(spy).toHaveBeenCalledWith(
        getConfig().storageKey,
        JSON.stringify({ en: res }),
      );
    }));

    it(`GIVEN translations already cached in async storage
        WHEN getTranslation is called again for same language
        THEN does not call loader again`, fakeAsync(() => {
      const spy = spyOnGetTranslation();
      tick(DELAY);
      spectator.service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      spectator.service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      expect(spy).toHaveBeenCalledTimes(1);
    }));

    it(`GIVEN translations cached in async storage then cleared
        WHEN getTranslation is called after clearCache
        THEN calls loader again`, fakeAsync(() => {
      const spy = spyOnGetTranslation();
      tick(DELAY);
      spectator.service.getTranslation('en').subscribe();
      spectator.service.clearCache();
      spectator.service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      expect(spy).toHaveBeenCalledTimes(2);
    }));

    it(`GIVEN multiple languages requested with async storage
        WHEN getTranslation is called for different languages
        THEN calls loader for each language`, fakeAsync(() => {
      const spy = spyOnGetTranslation();
      tick(DELAY);
      spectator.service.getTranslation('en').subscribe();
      spectator.service.getTranslation('es').subscribe();
      tick(DELAY * 4);
      expect(spy).toHaveBeenCalledTimes(2);
    }));

    it(`GIVEN multiple languages loaded in async storage
        WHEN checking storage after all async operations complete
        THEN storage contains all languages without overriding`, fakeAsync(() => {
      tick(DELAY);
      spectator.service.getTranslation('en').subscribe();
      spectator.service.getTranslation('es').subscribe();
      tick(DELAY * 4);
      getStorageService()
        .getItem(getConfig().storageKey)
        .subscribe((translations: string) => {
          expect(Object.keys(JSON.parse(translations))).toEqual(['en', 'es']);
        });
      tick(DELAY);
    }));

    it(`GIVEN scoped and non-scoped translations requested
        WHEN getTranslation is called for 'en/scope' and 'en'
        THEN caches both scope and lang separately`, fakeAsync(() => {
      tick(DELAY);
      spectator.service.getTranslation('en/scope').subscribe();
      spectator.service.getTranslation('en').subscribe();
      tick(DELAY * 4);
      getStorageService()
        .getItem(getConfig().storageKey)
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
