import { TranslocoPersistLangService } from './persist-lang.service';
import { BehaviorSubject } from 'rxjs';

let fakeStorage = {
  storage: {},
  getItem: jasmine.createSpy().and.callFake(function(key) {
    return this.storage[key];
  }),
  setItem: jasmine.createSpy().and.callFake(function(key, value) {
    this.storage[key] = value;
  }),
  removeItem: jasmine.createSpy().and.callFake(function(key) {
    delete this.storage[key];
  })
};

describe('PersistLang - auto', () => {
  const translocoService = createService();
  let service;

  beforeAll(() => {
    // @ts-ignore
    spyOn(TranslocoPersistLangService.prototype, 'setActiveLang').and.callThrough();

    service = new TranslocoPersistLangService(translocoService as any, fakeStorage, {} as any);
  });

  describe('Save lang to storage', () => {
    it('should skip the initial lang', () => {
      spyOn(service, 'save').and.callThrough();
      expect(service.save).not.toHaveBeenCalled();
    });

    it('should save the lang in storage upon change', () => {
      spyOn(service, 'save').and.callThrough();
      translocoService.setActiveLang('es');
      expect(service.save).toHaveBeenCalledWith('es');
      expect(fakeStorage.setItem).toHaveBeenCalledWith('translocoLang', 'es');
    });
  });

  describe('Get lang from storage', () => {
    it('should get the lang from storage', () => {
      expect(service.setActiveLang).toHaveBeenCalled();
      expect(fakeStorage.getItem).toHaveBeenCalledWith('translocoLang');
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

function createService() {
  return {
    langChanges$: new BehaviorSubject('en'),
    setActiveLang(lang) {
      this.langChanges$.next(lang);
    },
    config: {
      defaultLang: 'en'
    }
  };
}
