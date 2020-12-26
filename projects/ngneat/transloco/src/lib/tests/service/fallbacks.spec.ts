import { of, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { mockLangs, runLoader } from '../transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import {
  DefaultFallbackStrategy,
  DefaultTranspiler,
  TranslocoFallbackStrategy,
  TranslocoService
} from '@ngneat/transloco';
import { DefaultHandler } from '../../transloco-missing-handler';
import { DefaultInterceptor } from '../../transloco.interceptor';

describe('Multiple fallbacks', () => {
  describe('DefaultFallbackStrategy', () => {
    let loader;

    beforeEach(() => {
      loader = {
        getTranslation(lang: string) {
          return timer(1000).pipe(
            map(() => mockLangs[lang]),
            map(translation => {
              if (lang === 'notExists' || lang === 'fallbackNotExists' || lang === 'notExists2') {
                throw new Error('error');
              }
              return translation;
            })
          );
        }
      };
    });

    it('should try load the fallbackLang when current lang failed', fakeAsync(() => {
      const service = new TranslocoService(
        loader,
        new DefaultTranspiler(),
        new DefaultHandler(),
        new DefaultInterceptor(),
        { defaultLang: 'en' },
        new DefaultFallbackStrategy({ fallbackLang: 'es', defaultLang: 'en', failedRetries: 2 })
      );

      spyOn(service, 'load').and.callThrough();
      service.load('notExists').subscribe();

      // notExists will try 3 times then the fallback
      expect((service.load as jasmine.Spy).calls.argsFor(0)).toEqual(['notExists']);
      runLoader(3);
      expect((service.load as jasmine.Spy).calls.argsFor(1)).toEqual([
        'es',
        { failedCounter: 1, fallbackLangs: ['es'] }
      ]);
      runLoader(1);

      expect(service.load).toHaveBeenCalledTimes(2);

      // it should set the fallback lang as active
      expect(service.getActiveLang()).toEqual('es');

      // clear the cache
      expect((service as any).cache.size).toEqual(1);
    }));

    it('should load the fallbackLang only once', fakeAsync(() => {
      const service = new TranslocoService(
        loader,
        new DefaultTranspiler(),
        new DefaultHandler(),
        new DefaultInterceptor(),
        { defaultLang: 'en' },
        new DefaultFallbackStrategy({ fallbackLang: 'es', defaultLang: 'en', failedRetries: 2 })
      );

      spyOn(service, 'load').and.callThrough();
      service.load('notExists').subscribe();

      // notExists will try 3 times then the fallback
      expect((service.load as jasmine.Spy).calls.argsFor(0)).toEqual(['notExists']);
      runLoader(3);
      expect((service.load as jasmine.Spy).calls.argsFor(1)).toEqual([
        'es',
        { failedCounter: 1, fallbackLangs: ['es'] }
      ]);
      runLoader(1);

      expect(service.load).toHaveBeenCalledTimes(2);

      // it should set the fallback lang as active
      expect(service.getActiveLang()).toEqual('es');

      service.load('notExists2').subscribe();
      // notExists2 will try 3 times then the fallback
      runLoader(4);
      expect((service.load as jasmine.Spy).calls.argsFor(2)).toEqual(['notExists2']);
      // Ensure that we don't call es again
      expect((service.load as jasmine.Spy).calls.argsFor(3)).toEqual([]);
      expect(service.getActiveLang()).toEqual('es');
      // clear the cache
      expect((service as any).cache.size).toEqual(1);
    }));

    it('should should throw if the fallback lang is failed to load', fakeAsync(() => {
      const service = new TranslocoService(
        loader,
        new DefaultTranspiler(),
        new DefaultHandler(),
        new DefaultInterceptor(),
        { defaultLang: 'en' },
        new DefaultFallbackStrategy({ fallbackLang: 'fallbackNotExists', defaultLang: 'en', failedRetries: 2 })
      );
      spyOn(service, 'load').and.callThrough();
      service
        .load('notExists')
        .pipe(
          catchError(e => {
            expect(e.message).toEqual('Unable to load translation and all the fallback languages');
            return of('');
          })
        )
        .subscribe();

      // notExists will try 3 times then the fallback 3 times
      runLoader(6);
      expect(service.load).toHaveBeenCalledTimes(2);
    }));
  });

  describe('CustomFallbackStrategy', () => {
    class StrategyTest implements TranslocoFallbackStrategy {
      // It may return arbitrary next langs based on the failed lang.
      // It should try each of the provided fallback langs.
      getNextLangs(failedLang: string): string[] {
        if (failedLang === 'notExists') {
          return ['it', 'gp', 'en'];
        } else {
          return ['es'];
        }
      }
    }

    let loader;

    beforeEach(() => {
      loader = {
        getTranslation(lang: string) {
          return timer(1000).pipe(
            map(() => mockLangs[lang]),
            map(translation => {
              if (lang === 'it' || lang === 'gp' || lang === 'notExists') {
                throw new Error('error');
              }
              return translation;
            })
          );
        }
      };
    });

    it('should try load the it and gp then set en as the active', fakeAsync(() => {
      const service = new TranslocoService(
        loader,
        new DefaultTranspiler(),
        new DefaultHandler(),
        new DefaultInterceptor(),
        { defaultLang: 'es' },
        new StrategyTest()
      );

      spyOn(service, 'load').and.callThrough();
      service.load('notExists').subscribe();

      // 3 notExists / 3 it / 3 gp / 1 en = 10
      expect((service.load as jasmine.Spy).calls.argsFor(0)).toEqual(['notExists']);
      runLoader(3);
      expect((service.load as jasmine.Spy).calls.argsFor(1)).toEqual([
        'it',
        { failedCounter: 1, fallbackLangs: ['it', 'gp', 'en'] }
      ]);
      runLoader(3);
      expect((service.load as jasmine.Spy).calls.argsFor(2)).toEqual([
        'gp',
        { failedCounter: 2, fallbackLangs: ['it', 'gp', 'en'] }
      ]);
      runLoader(3);
      expect((service.load as jasmine.Spy).calls.argsFor(3)).toEqual([
        'en',
        { failedCounter: 3, fallbackLangs: ['it', 'gp', 'en'] }
      ]);
      runLoader(1);

      expect(service.load).toHaveBeenCalledTimes(4);

      // it should set the fallback lang as active
      expect(service.getActiveLang()).toEqual('en');

      // clear the cache
      expect((service as any).cache.size).toEqual(1);
    }));
  });
});
