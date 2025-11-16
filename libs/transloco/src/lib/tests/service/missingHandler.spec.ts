import { fakeAsync } from '@angular/core/testing';

import { createService, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('missingHandler', () => {
  describe('missingHandler.allowEmpty', () => {
    it(`GIVEN allowEmpty config is true
        WHEN translating empty string
        THEN should not call missing handler`, () => {
      const service = createService({
        missingHandler: { allowEmpty: true },
      });
      service.setTranslation(
        {
          empty: '',
        },
        'en',
      );

      spyOn((service as any).missingHandler, 'handle').and.callThrough();
      const value = service.translate('empty');

      expect(value).toEqual('');
      expect((service as any).missingHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('missingHandler.useFallbackTranslation', () => {
    let service: TranslocoService;
    beforeEach(() => {
      service = createService({
        fallbackLang: 'es',
        missingHandler: {
          useFallbackTranslation: true,
        },
      });
    });

    it(`GIVEN useFallbackTranslation is enabled
        WHEN loading translations
        THEN should load both active and fallback lang`, fakeAsync(() => {
      const loaderSpy = spyOn(
        (service as any).loader,
        'getTranslation',
      ).and.callThrough();
      service.load('en').subscribe();
      runLoader();
      expect(loaderSpy).toHaveBeenCalledTimes(2);
      expect(loaderSpy.calls.allArgs()).toEqual([
        ['en', undefined],
        ['es', undefined],
      ]);
    }));

    it(`GIVEN missing key in active lang
        WHEN translating
        THEN should get translation from fallback lang`, fakeAsync(() => {
      spyOn((service as any).loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      const result = service.translate('fallback');
      expect(result).toEqual("I'm a spanish fallback");
    }));

    it(`GIVEN empty value in active lang
        WHEN translating with params
        THEN should get translation from fallback lang`, fakeAsync(() => {
      spyOn((service as any).loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual(
        "I'm a spanish empty fallback hello",
      );
    }));

    it(`GIVEN scoped translations with fallback
        WHEN loading scoped translations
        THEN should load scope fallback lang`, fakeAsync(() => {
      const loaderSpy = spyOn(
        (service as any).loader,
        'getTranslation',
      ).and.callThrough();
      service.load('lazy-page/en').subscribe();
      runLoader(2000);
      expect(loaderSpy.calls.allArgs()).toEqual([
        ['lazy-page/en', { scope: 'lazy-page' }],
        ['lazy-page/es', { scope: 'lazy-page' }],
      ]);
      expect(service.translate('empty', {}, 'lazy-page/en')).toEqual(
        'resolved from es',
      );
    }));

    it(`GIVEN allowEmpty is enabled with fallback
        WHEN translating empty value
        THEN should return empty string not fallback`, fakeAsync(() => {
      service.config.missingHandler.allowEmpty = true;
      spyOn((service as any).loader, 'getTranslation').and.callThrough();
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual('');
    }));
  });
});
