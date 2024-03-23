import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject } from 'rxjs';

import { TranslocoPersistLangService } from './persist-lang.service';
import { PersistStorage } from './persist-lang.types';
import { provideTranslocoPersistLang } from './persist-lang.providers';

interface FakeStorage extends PersistStorage {
  storage: Map<string, any>;
}

const fakeStorage: FakeStorage = {
  storage: new Map(),
  getItem(key) {
    return this.storage.get(key) || null;
  },
  setItem(key, value) {
    this.storage.set(key, value);
  },
  removeItem(key) {
    this.storage.delete(key);
  },
};

const translocoServiceMock = {
  langChanges$: new BehaviorSubject('en'),
  setActiveLang(lang: string) {
    this.langChanges$.next(lang);
  },
  config: {
    defaultLang: 'en',
  },
  getActiveLang() {
    return this.langChanges$.getValue();
  },
};

describe('PersistLang', () => {
  let spectator: SpectatorService<TranslocoPersistLangService>;
  const serviceFactory = createServiceFactory({
    service: TranslocoPersistLangService,
    providers: [
      mockProvider(TranslocoService, translocoServiceMock),
      provideTranslocoPersistLang({
        storage: {
          useValue: fakeStorage,
        },
      }),
    ],
  });

  let saveSpy: jasmine.Spy<
    (typeof TranslocoPersistLangService.prototype)['save']
  >;

  beforeEach(() => {
    spectator = serviceFactory();
    saveSpy = spyOn(
      TranslocoPersistLangService.prototype as any,
      'save'
    ).and.callThrough();
  });

  describe('Save lang to storage', () => {
    it('should skip the initial lang', () => {
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should save the lang in storage upon change', () => {
      const setItemSpy = spyOn(fakeStorage, 'setItem').and.callThrough();
      spectator.inject(TranslocoService).setActiveLang('es');
      expect(saveSpy).toHaveBeenCalledWith('es');
      expect(setItemSpy).toHaveBeenCalledWith('translocoLang', 'es');
    });
  });

  describe('Get lang from storage', () => {
    let setActiveLangSpy: jasmine.Spy<
      (typeof TranslocoPersistLangService.prototype)['setActiveLang']
    >;
    let getItemSpy: jasmine.Spy<PersistStorage['getItem']>;

    beforeAll(() => {
      setActiveLangSpy = spyOn(
        TranslocoPersistLangService.prototype as any,
        'setActiveLang'
      ).and.callThrough();
      getItemSpy = spyOn(fakeStorage, 'getItem').and.callThrough();
    });

    it('should get the lang from storage', () => {
      expect(setActiveLangSpy).toHaveBeenCalled();
      expect(getItemSpy).toHaveBeenCalledWith('translocoLang');
      expect(spectator.inject(TranslocoService).getActiveLang()).toEqual('es');
    });

    it('should return the cached lang', () => {
      expect(spectator.service.getCachedLang()).toEqual('es');
    });
  });

  it('should clear the lang from storage', () => {
    spectator.service.clear();
    expect(spectator.service.getCachedLang()).toEqual(null);
  });
});
