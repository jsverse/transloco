import en from '../../../../../../src/assets/i18n/en';
import { DefaultTranspiler, TranslocoService } from '../../public-api';
import { createService, loader, mockLangs, runLoader } from './transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { catchError, filter, map, pluck } from 'rxjs/operators';
import { of, timer } from 'rxjs';
import { DefaultHandler } from '../transloco-missing-handler';
import { DefaultInterceptor } from '../transloco.interceptor';
import { TranslocoFallbackStrategy } from '../transloco-fallback-strategy';
import Spy = jasmine.Spy;

function createSpy() {
  return jasmine.createSpy();
}

describe('TranslocoService', () => {
  let service: TranslocoService;

  function loadLang(lang = 'en') {
    service.load(lang).subscribe();
    runLoader();
  }

  describe('translate', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should return empty string when the key is falsy', () => {
      expect(service.translate('')).toEqual('');
      expect(service.translate(null)).toEqual('');
      expect(service.translate(undefined)).toEqual('');
    });

    it('should return empty string when there is no translation file for the active lang', fakeAsync(() => {
      expect(service.translate('home')).toEqual('');
      loadLang();
      expect(service.translate('home')).toEqual(mockLangs['en'].home);
      service.setActiveLang('es');
      expect(service.translate('home')).toEqual('');
    }));

    it('should call missing handler when there is no translation for the key', fakeAsync(() => {
      spyOn((service as any).missingHandler, 'handle').and.callThrough();
      loadLang();
      service.translate('kazaz');
      service.translate('netanel');
      service.translate('itay');
      expect((service as any).missingHandler.handle).toHaveBeenCalledTimes(3);
    }));

    it('should translate', fakeAsync(() => {
      loadLang();
      const eng = mockLangs['en'];
      expect(service.translate('home')).toEqual(eng.home);
      expect(service.translate('alert', { value: 'val' })).toEqual('alert val english');
      expect(service.translate('a.b.c')).toEqual('a.b.c from list english');
      expect(service.translate('key.is.like.path')).toEqual('key is like path');
    }));

    it('should translate using a cb', fakeAsync(() => {
      loadLang();
      const eng = mockLangs['en'];
      expect(service.translate(en => en.home)).toEqual(eng.home);
      expect(service.translate(en => en.a.b.c)).toEqual('a.b.c from list english');
    }));

    it('should translate using a cb with params', fakeAsync(() => {
      loadLang();
      expect(service.translate(en => en.alert, { value: 'val' })).toEqual('alert val english');
    }));

    it('should support multi key translation', fakeAsync(() => {
      loadLang();
      const expected = ['home english', 'a.b.c from list english', ''];
      expect(service.translate(['home', 'a.b.c', 'notexists'])).toEqual(expected);
    }));

    it('should support multi key translation with dynamic values', fakeAsync(() => {
      loadLang();
      const expected = ['home english', 'alert val english', 'a.b.c from list english'];
      expect(service.translate(['home', 'alert', 'a.b.c'], { value: 'val' })).toEqual(expected);
    }));

    describe('translateValue', () => {
      it('should translate a given value', fakeAsync(() => {
        loadLang();
        const translation = service.transpile(en.home, { value: 'val' });
        expect(translation).toBe('home english');
      }));

      it('should translate a given value with params', fakeAsync(() => {
        loadLang();
        const translation = service.transpile(en.alert, { value: 'val' });
        expect(translation).toBe('alert val english');
      }));
    });

    describe('selectTranslate', () => {
      it('should return an observable with the translation value', fakeAsync(() => {
        const spy = createSpy();
        service.selectTranslate('home').subscribe(spy);
        runLoader();
        expect(spy).toHaveBeenCalledWith('home english');
      }));

      it('should return an observable with the translation value with param', fakeAsync(() => {
        const spy = createSpy();
        service.selectTranslate('alert', { value: 'val' }).subscribe(spy);
        runLoader();
        expect(spy).toHaveBeenCalledWith('alert val english');
      }));
    });

    describe('getTranslation', () => {
      it('should return undefined when no translations loaded', () => {
        expect(service.getTranslation('en')).toBeUndefined();
        expect(service.getTranslation('es')).toBeUndefined();
      });

      it('should return the translation file', fakeAsync(() => {
        loadLang();
        expect(service.getTranslation('en')).toEqual(mockLangs['en']);
      }));

      it('should return the translations map', fakeAsync(() => {
        loadLang();
        loadLang('es');
        const map = service.getTranslation();
        expect(map instanceof Map).toEqual(true);
        expect(map.get('en')).toEqual(mockLangs['en']);
        expect(map.get('es')).toEqual(mockLangs['es']);
      }));
    });

    it('should set the current lang', () => {
      const langSpy = createSpy();
      const newLang = 'es';
      service.langChanges$.subscribe(langSpy);
      service.setActiveLang(newLang);
      expect(langSpy).toHaveBeenCalledWith(newLang);
    });

    it('should set the current lang and load the new lang file', () => {
      const langSpy = createSpy();
      const newLang = 'es';
      spyOn(service, 'load');
      service.langChanges$.subscribe(langSpy);
      service.setActiveLang(newLang, { load: true });
      expect(langSpy).toHaveBeenCalledWith(newLang);
      expect(service.load).toHaveBeenCalledWith(newLang, { fallbackLang: undefined });
    });

    describe('setTranslation', () => {
      it('should merge the data', fakeAsync(() => {
        loadLang();
        const translation = { bar: 'bar' };
        service.setTranslation('en', translation);
        const newTranslation = service.getTranslation('en');

        expect(newTranslation.bar).toEqual('bar');
        expect(newTranslation.home).toEqual('home english');
      }));

      it('should deep merge', fakeAsync(() => {
        loadLang();
        const translation = { a: { bar: 'bar' } };
        service.setTranslation('en', translation);
        const newTranslation = service.getTranslation('en');
        expect(newTranslation.a.bar).toEqual('bar');
      }));

      it('should replace it', fakeAsync(() => {
        loadLang();
        const translation = { newKey: 'a', newKeyTwo: 'b' };
        service.setTranslation('en', translation, { merge: false });
        const newTranslation = service.getTranslation('en');
        expect(newTranslation).toEqual({ newKey: 'a', newKeyTwo: 'b' });
      }));

      it('should add the lang if it not exists', fakeAsync(() => {
        loadLang();
        service.setTranslation('es', { home: 'home es' });
        expect(service.getTranslation('es').home).toEqual('home es');
      }));
    });

    describe('setTranslationKey', () => {
      it('should override key', fakeAsync(() => {
        loadLang();
        service.setTranslationKey('a', 'new value');
        const newTranslation = service.getTranslation('en');
        expect(newTranslation.a).toEqual('new value');
      }));

      it('should deep override key', fakeAsync(() => {
        loadLang();
        service.setTranslationKey('a.b.c', 'new value');
        const newTranslation = service.getTranslation('en');
        expect(newTranslation.a.b.c).toEqual('new value');
      }));

      it('should do nothing if lang not exists', fakeAsync(() => {
        loadLang();
        spyOn((service as any).translations, 'set').and.callThrough();
        service.setTranslationKey('a', 'new value', 'es');
        expect((service as any).translations.set).not.toHaveBeenCalled();
      }));
    });

    describe('load', () => {
      it('should trigger loaded event once loaded', fakeAsync(() => {
        const spy = createSpy();
        service.events$
          .pipe(
            filter(e => e.type === 'translationLoadSuccess'),
            pluck('payload')
          )
          .subscribe(spy);
        loadLang();
        expect(spy).toHaveBeenCalledWith({ lang: 'en' });
      }));

      it('should load the translation using the loader', fakeAsync(() => {
        spyOn((service as any).loader, 'getTranslation').and.callThrough();
        service.load('en').subscribe();
        runLoader();
        expect((service as any).loader.getTranslation).toHaveBeenCalledWith('en');
        expect((service as any).translations.size).toEqual(1);
      }));

      it('should load the translation from cache', fakeAsync(() => {
        loadLang();
        spyOn((service as any).loader, 'getTranslation').and.callThrough();
        service.load('en');
        expect((service as any).loader.getTranslation).not.toHaveBeenCalled();
      }));

      const failLoad = times => {
        let counter = 0;
        return lang => {
          return timer(1000)
            .pipe(map(() => mockLangs[lang]))
            .pipe(
              map(val => {
                if (counter < times) {
                  counter++;
                  throw new Error(`can't load`);
                }
                return val;
              })
            );
        };
      };

      it('should return the fallback lang if the load fails 3 times', fakeAsync(() => {
        const eventSpy = createSpy();
        service.events$
          .pipe(
            filter(e => e.type === 'translationLoadFailure'),
            pluck('payload')
          )
          .subscribe(eventSpy);
        spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(4));
        const spy = createSpy();

        spyOn(service, 'load').and.callThrough();
        service.load('es').subscribe(spy);
        runLoader(5);

        /* One for es and one for fallback */
        expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(2);
        expect(service.load).toHaveBeenCalledTimes(2);
        const fallback = (service as any).fallbackStrategy.handle();
        expect((service.load as Spy).calls.allArgs()).toEqual([['es'], [fallback[0], { fallbackLang: fallback }]]);
        expect(spy.calls.argsFor(0)[0]).toEqual(mockLangs['en']);
        expect(eventSpy).toHaveBeenCalledTimes(1);
        expect(eventSpy).toHaveBeenCalledWith({
          lang: 'es'
        });
      }));

      it('should stop retrying to load the fallback lang after 3 tries', fakeAsync(() => {
        const spy = createSpy().and.returnValue(of());
        spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(3));

        service
          .load('en')
          .pipe(catchError(spy))
          .subscribe();

        /* 3 times - first try + 2 retries */
        runLoader(3);
        expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(1);
        const expectedMsg = 'Unable to load translation and all the fallback languages (en)';
        const givenMsg = (spy.calls.argsFor(0)[0] as any).message;
        expect(givenMsg).toEqual(expectedMsg);
      }));

      describe('Multiple fallbacks', () => {
        let spy;
        beforeEach(() => {
          class StrategyTest implements TranslocoFallbackStrategy {
            handle(failedLang: string): string[] {
              return ['it', 'gp', 'en'];
            }
          }
          service = new TranslocoService(
            loader,
            new DefaultTranspiler(),
            new DefaultHandler(),
            new DefaultInterceptor(),
            { defaultLang: 'en' },
            new StrategyTest()
          );
          spy = createSpy().and.returnValue(of());
        });
        it('should return the last fallback lang', fakeAsync(() => {
          spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(9));
          service.load('es').subscribe(spy);

          /* 9 times - first try + 2 retries for each lang including the fallback */
          runLoader(10);
          /* 4 times - es, it, gp, en */
          expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)[0]).toEqual(mockLangs['en']);
        }));
        it('should fail all loading attempts and throw an error', fakeAsync(() => {
          spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(12));
          service
            .load('es')
            .pipe(catchError(spy))
            .subscribe();

          /* 12 times - first try + 2 retries for each lang including the fallback */
          runLoader(12);
          /* 4 times - es, it, gp, en */
          expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(4);
          const expectedMsg = 'Unable to load translation and all the fallback languages (it, gp, en)';
          const givenMsg = (spy.calls.argsFor(0)[0] as any).message;
          expect(givenMsg).toEqual(expectedMsg);
        }));
      });
    });

    describe('Custom Interceptor', () => {
      it('should support', fakeAsync(() => {
        (service as any).interceptor = {
          preSaveTranslation(translation, lang) {
            return Object.keys(translation).reduce((acc: any, key) => {
              acc[key] = `Intercepted ${key}`;
              return acc;
            }, {});
          },
          preSaveTranslationKey(key, value) {
            return `preSaveTranslationKey ${key}`;
          }
        };
        loadLang();
        runLoader();
        const translation = service.getTranslation('en');
        Object.keys(translation).forEach(key => {
          expect(translation[key]).toEqual(`Intercepted ${key}`);
        });
        service.setTranslationKey('home', 'test');
        expect(service.translate('home')).toEqual('preSaveTranslationKey home');
      }));
    });
  });
});
