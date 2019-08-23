import { TranslocoPersistLangService } from './persist-lang.service';
import { BehaviorSubject } from 'rxjs';

let storage = {};

describe('PersistLang - auto', () => {
  const translocoService = createService();
  let service;

  beforeAll(() => {
    setupSpies();

    service = new TranslocoPersistLangService(translocoService as any, {
      strategy: 'auto'
    });
  });

  describe('Save lang to storage', () => {
    it('should skip the initial lang', () => {
      // @ts-ignore
      spyOn(service, 'save').and.callThrough();
      // @ts-ignore
      expect(service.save).not.toHaveBeenCalled();
    });

    it('should save the lang in storage upon change', () => {
      // @ts-ignore
      spyOn(service, 'save').and.callThrough();
      translocoService.setActiveLang('es');
      // @ts-ignore
      expect(service.save).toHaveBeenCalledWith('es');
      expect(localStorage.setItem).toHaveBeenCalledWith('translocoLang', 'es');
    });
  });

  describe('Get lang from storage', () => {
    it('should get the lang from storage', () => {
      expect(service.setActiveLang).toHaveBeenCalled();
      expect(localStorage.getItem).toHaveBeenCalledWith('translocoLang');
      expect(translocoService.langChanges$.getValue()).toEqual('es');
    });

    it('should return the cached lang', () => {
      expect(service.getCachedLang()).toEqual('es');
    });
  });

  it('should clear the lang from storage', () => {
    service.clear();
    expect(service.getCachedLang()).toEqual(undefined);
  });
});

describe('PersistLang - manual', () => {
  const translocoService = createService();
  let service;

  beforeAll(() => {
    setupSpies();

    service = new TranslocoPersistLangService(translocoService as any, {
      strategy: 'manual'
    });
  });

  it('should not auto set the lang from the storage', () => {
    expect(service.setActiveLang).not.toHaveBeenCalled();
  });
});

function createService() {
  return {
    langChanges$: new BehaviorSubject('en'),
    getBrowserLang() {
      return 'es';
    },
    setActiveLang(lang) {
      this.langChanges$.next(lang);
    },
    config: {
      defaultLang: 'en'
    }
  };
}

function setupSpies() {
  // @ts-ignore
  spyOn(TranslocoPersistLangService.prototype, 'setActiveLang').and.callThrough();

  spyOn(localStorage, 'getItem').and.callFake(key => {
    return storage[key];
  });

  spyOn(localStorage, 'setItem').and.callFake((key, value) => {
    storage[key] = value;
  });

  spyOn(localStorage, 'removeItem').and.callFake(key => {
    delete storage[key];
  });
}
