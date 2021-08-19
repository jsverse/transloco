import { TranslocoPersistLangService } from './persist-lang.service';
import { BehaviorSubject } from 'rxjs';
import { PersistStorage } from '@ngneat/transloco';

interface FakeStorage extends PersistStorage {
  storage: Record<string, any>;
}

const fakeStorage: FakeStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
  },
  removeItem(key) {
    delete this.storage[key];
  }
};

describe('PersistLang - auto', () => {
  const translocoService = createService();
  let service: TranslocoPersistLangService;

  beforeAll(() => {
    ['getItem', 'setItem', 'removeItem'].forEach((prop) => {
      spyOn(fakeStorage, prop as keyof PersistStorage).and.callThrough();
    });

    spyOn<any>(TranslocoPersistLangService.prototype, 'setActiveLang').and.callThrough();

    service = new TranslocoPersistLangService(translocoService as any, fakeStorage, {} as any);
  });

  describe('Save lang to storage', () => {
    it('should skip the initial lang', () => {
      spyOn<any>(service, 'save').and.callThrough();
      expect((service as any).save).not.toHaveBeenCalled();
    });

    it('should save the lang in storage upon change', () => {
      spyOn<any>(service, 'save').and.callThrough();
      translocoService.setActiveLang('es');
      expect((service as any).save).toHaveBeenCalledWith('es');
      expect(fakeStorage.setItem).toHaveBeenCalledWith('translocoLang', 'es');
    });
  });

  describe('Get lang from storage', () => {
    it('should get the lang from storage', () => {
      expect((service as any).setActiveLang).toHaveBeenCalled();
      expect(fakeStorage.getItem).toHaveBeenCalledWith('translocoLang');
      expect(translocoService.langChanges$.getValue()).toEqual('es');
    });

    it('should return the cached lang', () => {
      expect(service.getCachedLang()).toEqual('es');
    });
  });

  it('should clear the lang from storage', () => {
    service.clear();
    expect(service.getCachedLang()).toEqual(null);
  });
});

function createService() {
  return {
    langChanges$: new BehaviorSubject('en'),
    setActiveLang(lang: string) {
      this.langChanges$.next(lang);
    },
    config: {
      defaultLang: 'en'
    }
  };
}
