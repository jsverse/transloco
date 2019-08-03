import en from '../../../../../src/assets/i18n/en';
import { DefaultParser, TranslocoService } from '../../public-api';
import { loader, mockLangs, runLoader } from './transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { catchError, map } from 'rxjs/operators';
import { DefaultHandler } from '../transloco-missing-handler';
import { of, timer } from 'rxjs';

function createSpy() {
  return jasmine.createSpy();
}

describe('TranslocoService', () => {
  let service: TranslocoService;

  function loadLang(lang = 'en') {
    service._load(lang).subscribe();
    runLoader();
  }

  describe('translate', () => {

    beforeEach(() => {
      service = new TranslocoService(loader, new DefaultParser(), new DefaultHandler(), {});
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
        const translation = service.translateValue(en.home, { value: 'val' });
        expect(translation).toBe('home english');
      }));

      it('should translate a given value with params', fakeAsync(() => {
        loadLang();
        const translation = service.translateValue(en.alert, { value: 'val' });
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
    });

    it('should set the current lang', () => {
      const langSpy = createSpy();
      const newLang = 'es';
      service.lang$.subscribe(langSpy);
      service.setActiveLang(newLang);
      expect(langSpy).toHaveBeenCalledWith(newLang);
    });

    it('should set the current lang and load the new lang file', () => {
      const langSpy = createSpy();
      const newLang = 'es';
      spyOn(service, '_load');
      service.lang$.subscribe(langSpy);
      service.setLangAndLoad(newLang);
      expect(langSpy).toHaveBeenCalledWith(newLang);
      expect(service._load).toHaveBeenCalledWith(newLang);
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
      it('should trigger translationLoaded once loaded', fakeAsync(() => {
        const spy = createSpy();
        service.translationLoaded$.subscribe(spy);
        loadLang();
        expect(spy).toHaveBeenCalledWith({ lang: 'en' });
      }));

      it('should load the translation using the loader', fakeAsync(() => {
        spyOn((service as any).loader, 'getTranslation').and.callThrough();
        service._load('en').subscribe();
        runLoader();
        expect((service as any).loader.getTranslation).toHaveBeenCalledWith('en');
        expect((service as any).translations.size).toEqual(1);
      }));

      it('should load the translation from cache', fakeAsync(() => {
        loadLang();
        spyOn((service as any).loader, 'getTranslation').and.callThrough();
        service._load('en');
        expect((service as any).loader.getTranslation).not.toHaveBeenCalled();
      }));

      const failLoad = times => {
        let counter = 0;
        return (lang) => {
          return timer(1000).pipe(map(() => mockLangs[lang])).pipe(
            map(val => {
              if( counter < times ) {
                counter++;
                throw new Error(`can't load`);
              }
              return val;
            })
          );
        };
      };

      it('should return the default lang if the load fails 3 times', fakeAsync(() => {
        spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(4));
        const spy = createSpy();

        spyOn(service, '_load').and.callThrough();
        service._load('es').subscribe(spy);
        runLoader(5);

        /* One for es and one for fallback */
        expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(2);
        expect(service._load).toHaveBeenCalledTimes(2);
        expect(service._load).toHaveBeenCalledWith(service.config.defaultLang);
        expect(spy.calls.argsFor(0)[0]).toEqual(mockLangs['en']);
      }));

      it('should stop retrying to load the default lang when reaching 3 tries', fakeAsync(() => {
        const spy = createSpy().and.returnValue(of());
        spyOn((service as any).loader, 'getTranslation').and.callFake(failLoad(5));

        service
          ._load('en')
          .pipe(catchError(spy))
          .subscribe();

        /* 4 times - first try + 3 retries */
        runLoader(4);
        expect((service as any).loader.getTranslation).toHaveBeenCalledTimes(1);
        const expectedMsg = 'Unable to load the default translation file (en), reached maximum retries';
        const givenMsg = (spy.calls.argsFor(0)[0] as any).message;
        expect(givenMsg).toEqual(expectedMsg);
      }));

    });
  });

});

