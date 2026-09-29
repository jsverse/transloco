import { fakeAsync } from '@angular/core/testing';
import { map, timer } from 'rxjs';

import { createService, mockLangs, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';
import { TranslocoLoader } from '../../transloco.loader';

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

      vi.spyOn((service as any).missingHandler, 'handle');
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
      const loaderSpy = vi.spyOn((service as any).loader, 'getTranslation');
      service.load('en').subscribe();
      runLoader();
      expect(loaderSpy).toHaveBeenCalledTimes(2);
      expect(loaderSpy.mock.calls).toEqual([
        ['en', undefined],
        ['es', undefined],
      ]);
    }));

    it(`GIVEN missing key in active lang
        WHEN translating
        THEN should get translation from fallback lang`, fakeAsync(() => {
      vi.spyOn((service as any).loader, 'getTranslation');
      service.load('en').subscribe();
      runLoader(2000);
      const result = service.translate('fallback');
      expect(result).toEqual("I'm a spanish fallback");
    }));

    it(`GIVEN empty value in active lang
        WHEN translating with params
        THEN should get translation from fallback lang`, fakeAsync(() => {
      vi.spyOn((service as any).loader, 'getTranslation');
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual(
        "I'm a spanish empty fallback hello",
      );
    }));

    it(`GIVEN scoped translations with fallback
        WHEN loading scoped translations
        THEN should load scope fallback lang`, fakeAsync(() => {
      const loaderSpy = vi.spyOn((service as any).loader, 'getTranslation');
      service.load('lazy-page/en').subscribe();
      runLoader(2000);
      expect(loaderSpy.mock.calls).toEqual([
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
      vi.spyOn((service as any).loader, 'getTranslation');
      service.load('en').subscribe();
      runLoader(2000);
      expect(service.translate('empty', { value: 'hello' })).toEqual('');
    }));
  });

  describe('useFallbackTranslation - no duplicate request', () => {
    it(`GIVEN fallback lang is already cached
        WHEN loading another lang with useFallbackTranslation
        THEN should not make a duplicate request for the fallback lang`, fakeAsync(() => {
      // Record every lang the loader is actually asked to fetch, so we can
      // assert on real requests instead of spying on service internals.
      const requestedLangs: string[] = [];

      class RecordingLoader implements TranslocoLoader {
        getTranslation(lang: string) {
          requestedLangs.push(lang);
          return timer(1000).pipe(map(() => mockLangs[lang]));
        }
      }

      const service = createService(
        {
          // defaultLang and fallbackLang both default to 'en' in createService.
          missingHandler: { useFallbackTranslation: true },
        },
        { loader: RecordingLoader },
      );

      // Loads 'en' as the default lang -> fetched once.
      service.load('en').subscribe();
      runLoader();

      // Loads 'es'; its fallback is 'en', which is already cached, so only
      // 'es' should hit the loader here.
      service.load('es').subscribe();
      runLoader();

      expect(requestedLangs).toEqual(['en', 'es']);
      // 'es' resolved from its own file, and a key missing in 'es' still
      // falls back to the cached 'en'.
      expect(service.translate('home', {}, 'es')).toEqual('home spanish');
      expect(service.translate('key.is.like.path', {}, 'es')).toEqual(
        'key is like path',
      );
    }));
  });
});
