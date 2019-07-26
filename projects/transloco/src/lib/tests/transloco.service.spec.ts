import { createService } from '@netbasal/spectator';
import { TRANSLOCO_LOADER, TranslocoLoader, TranslocoService } from '@ngneat/transloco';
import { load, providersMock, runLoader } from './transloco.mocks';
import createSpy = jasmine.createSpy;
import { fakeAsync } from '@angular/core/testing';
import en from '../../../../../src/assets/langs/en.json';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from '../transloco-missing-handler';
import { of, throwError, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

describe('TranslocoService', () => {
  const spectator = createService({
    service: TranslocoService,
    providers: [providersMock]
  });

  function loadLang(lang = 'en') {
    spectator.service.load(lang).subscribe();
    runLoader();
  }

  describe('load', () => {
    const failLoad = times => {
      let counter = 0;
      return () =>
        load('en').pipe(
          map(val => {
            if (counter < times) {
              counter++;
              throw new Error(`can't load`);
            }
            return val;
          })
        );
    };

    it('should return the default lang if the load fails', fakeAsync(() => {
      loadLang();
      (spectator.service as any).loader = createSpy().and.callFake(failLoad(1));
      spectator.service.load('es').subscribe();
      runLoader(2);
      /* Once since en is in cache */
      expect((spectator.service as any).loader).toHaveBeenCalledTimes(1);
    }));

    it('should stop retrying to load the default lang when reaching 3 tries', fakeAsync(() => {
      const spy = createSpy().and.returnValue(of());
      (spectator.service as any).loader = createSpy().and.callFake(failLoad(5));
      const loader = (spectator.service as any).loader;
      spectator.service
        .load('en')
        .pipe(catchError(spy))
        .subscribe();
      /* 4 times - first try + 3 retries */
      runLoader(4);
      expect(loader).toHaveBeenCalledTimes(1);
      const expectedMsg = 'Unable to load the default translation file (en), reached maximum retries';
      const givenMsg = (spy.calls.argsFor(0)[0] as any).message;
      expect(givenMsg).toEqual(expectedMsg);
    }));
    it('should trigger translationLoaded once loaded', fakeAsync(() => {
      const spy = createSpy();
      spectator.service.translationLoaded$.subscribe(spy);
      loadLang();
      expect(spy).toHaveBeenCalledWith({ lang: 'en' });
    }));
    it('should load the translation using the loader', fakeAsync(() => {
      (spectator.service as any).loader = createSpy(
        'loader',
        spectator.get<TranslocoLoader>(TRANSLOCO_LOADER)
      ).and.callThrough();
      spectator.service.load('en').subscribe();
      runLoader();
      expect((spectator.service as any).loader).toHaveBeenCalledWith('en');
    }));
    it('should load the translation from cache', fakeAsync(() => {
      loadLang();
      (spectator.service as any).loader = createSpy(
        'loader',
        spectator.get<TranslocoLoader>(TRANSLOCO_LOADER)
      ).and.callThrough();
      spectator.service.load('en');
      expect((spectator.service as any).loader).not.toHaveBeenCalled();
    }));
  });

  describe('translate', () => {
    it('should return empty string when the key is falsy', () => {
      expect(spectator.service.translate('')).toEqual('');
      expect(spectator.service.translate(null)).toEqual('');
      expect(spectator.service.translate(undefined)).toEqual('');
    });

    it('should return empty string when there is no translation file for the active lang', fakeAsync(() => {
      expect(spectator.service.translate('home')).toEqual('');
      loadLang();
      expect(spectator.service.translate('home')).not.toEqual('');
      spectator.service.setLang('es');
      expect(spectator.service.translate('home')).toEqual('');
    }));

    it('should call missing handler when there is no translation for the key', fakeAsync(() => {
      const missingHandler = spectator.get<TranslocoMissingHandler>(TRANSLOCO_MISSING_HANDLER);
      spyOn(missingHandler, 'handle');
      loadLang();
      spectator.service.translate('kazaz');
      spectator.service.translate('netanel');
      spectator.service.translate('itay');
      expect(missingHandler.handle).toHaveBeenCalledTimes(3);
    }));

    it('should translate', fakeAsync(() => {
      loadLang();
      expect(spectator.service.translate('home')).toEqual('home english');
      expect(spectator.service.translate('alert', { value: 'val' })).toEqual('alert val english');
      expect(spectator.service.translate('a.b.c')).toEqual('a.b.c from list english');
    }));
  });

  describe('translateValue', () => {
    it('should translate a given value', fakeAsync(() => {
      loadLang();
      const translation = spectator.service.translateValue(en.home, { value: 'val' });
      expect(translation).toBe('home english');
    }));

    it('should translate a given value with params', fakeAsync(() => {
      loadLang();
      const translation = spectator.service.translateValue(en.alert, { value: 'val' });
      expect(translation).toBe('alert val english');
    }));
  });

  describe('selectTranslate', () => {
    it('should return an observable with the translation value', fakeAsync(() => {
      const spy = createSpy();
      spectator.service.selectTranslate('home').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('home english');
    }));

    it('should return an observable with the translation value with param', fakeAsync(() => {
      const spy = createSpy();
      spectator.service.selectTranslate('alert', { value: 'val' }).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('alert val english');
    }));
  });

  describe('getTranslation', () => {
    it('should return undefined when no translations loaded', () => {
      expect(spectator.service.getTranslation('en')).toBeUndefined();
      expect(spectator.service.getTranslation('es')).toBeUndefined();
    });

    it('should return the translation file', fakeAsync(() => {
      loadLang();
      expect(spectator.service.getTranslation('en')).toEqual(en);
    }));
  });

  it('should set the current lang', () => {
    const langSpy = createSpy();
    const newLang = 'es';
    spectator.service.lang$.subscribe(langSpy);
    spectator.service.setLang(newLang);
    expect(langSpy).toHaveBeenCalledWith(newLang);
  });

  it('should set the current lang and load the new lang file', () => {
    const langSpy = createSpy();
    const newLang = 'es';
    spyOn(spectator.service, 'load');
    spectator.service.lang$.subscribe(langSpy);
    spectator.service.setLangAndLoad(newLang);
    expect(langSpy).toHaveBeenCalledWith(newLang);
    expect(spectator.service.load).toHaveBeenCalledWith(newLang);
  });
});
