import { createService, runLoader } from '../transloco.mocks';
import { fakeAsync } from '@angular/core/testing';

describe('missingHandler', () => {
  describe('missingHandler.allowEmpty', () => {
    const service: any = createService({ missingHandler: { allowEmpty: true } });

    it('should not call handle', () => {
      service.setTranslation(
        {
          empty: ''
        },
        'en'
      );

      spyOn(service.missingHandler, 'handle').and.callThrough();
      const value = service.translate('empty');

      expect(value).toEqual('');
      expect(service.missingHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('missingHandler.useFallbackTranslation', () => {
    let service;
    beforeEach(() => {
      service = createService({
        fallbackLang: 'es',
        missingHandler: {
          useFallbackTranslation: true
        }
      });
    });

    it('should load the active and the fallback lang', fakeAsync(() => {
      spyOn(service.loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader();
      expect(service.loader.getTranslation).toHaveBeenCalledTimes(2);
      expect(service.loader.getTranslation.calls.allArgs()).toEqual([['en'], ['es']]);
    }));

    it('should get the translation from the fallback when there is no key', fakeAsync(() => {
      spyOn(service.loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('fallback')).toEqual("I'm a spanish fallback");
    }));

    it('should get the translation from the fallback when the value is empty', fakeAsync(() => {
      spyOn(service.loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual("I'm a spanish empty fallback hello");
    }));

    it('should respect allow empty', fakeAsync(() => {
      service.mergedConfig.missingHandler.allowEmpty = true;
      spyOn(service.loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual('');
    }));
  });
});
