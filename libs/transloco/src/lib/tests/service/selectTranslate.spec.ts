import { fakeAsync, TestBed } from '@angular/core/testing';

import { createService, runLoader, inlineScope } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('selectTranslate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN a TranslocoService instance with English translations
      WHEN subscribing to selectTranslate for a translation key
      THEN should emit an observable with the translated value`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('home').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('home english');
  }));

  it(`GIVEN a TranslocoService with an active subscription to a translation key
      WHEN the active language is changed
      THEN should emit the new translated value in the new language`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('home').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('home english');
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith('home spanish');
  }));

  it(`GIVEN a TranslocoService instance with English translations
      WHEN subscribing to selectTranslate with a key and dynamic parameters
      THEN should emit the translation with interpolated parameter values`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('alert', { value: 'val' }).subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('alert val english');
  }));

  it(`GIVEN a TranslocoService instance
      WHEN subscribing to selectTranslate with an explicit language parameter
      THEN should emit the translation in the specified language and not respond to language changes`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('alert', { value: 'val' }, 'es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('alert val spanish');
    // it should not change the lang when static
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it(`GIVEN a TranslocoService with a scoped language loaded
      WHEN subscribing to selectTranslate with a scope parameter
      THEN should emit the translation from the scoped language file`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy english');
  }));

  it(`GIVEN a TranslocoService with scoped languages loaded
      WHEN subscribing to selectTranslate with an explicit scope/language combination
      THEN should emit the translation from the specified scope and language`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page/es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish');
  }));

  it(`GIVEN a TranslocoService with an active subscription to a scoped translation
      WHEN the active language is changed and only scope is provided
      THEN should emit the updated translation in the new language`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page').subscribe(spy);
    runLoader();
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(2);
  }));

  it(`GIVEN a TranslocoService with an active subscription to a scoped translation
      WHEN the active language is changed and explicit scope/language is provided
      THEN should not emit new values and remain locked to the specified language`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page/es').subscribe(spy);
    runLoader();
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish');
  }));

  it(`GIVEN a TranslocoService with scoped translations loaded
      WHEN subscribing to selectTranslate with a scope and dynamic parameters
      THEN should emit the scoped translation with interpolated parameter values`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate('withParam', { param: 'Transloco' }, 'lazy-page')
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
  }));

  it(`GIVEN a TranslocoService with scoped translations loaded
      WHEN subscribing to selectTranslate with explicit scope/language and dynamic parameters
      THEN should emit the translation from the specified scope and language with interpolated values`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate('withParam', { param: 'Transloco' }, 'lazy-page/es')
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish Transloco');
  }));

  it(`GIVEN a TranslocoService with nested scoped translations loaded
      WHEN subscribing to selectTranslate with a nested scope and dynamic parameters
      THEN should emit the translation from the nested scope with interpolated values`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate(
        'params',
        { value: 'Transloco' },
        'transpilers/messageformat',
      )
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Replaces standard Transloco - english');
  }));

  it(`GIVEN a TranslocoService with nested scoped translations loaded
      WHEN subscribing to selectTranslate with a nested scope, explicit language, and parameters
      THEN should emit the translation from the specified nested scope and language with interpolated values`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate(
        'params',
        { value: 'Transloco' },
        'transpilers/messageformat/es',
      )
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Replaces standard Transloco - spanish');
  }));

  describe('inline loader', () => {
    it(`GIVEN a TranslocoService with an inline loader configured
        WHEN subscribing to selectTranslate with the inline scope object
        THEN should emit the translation loaded from the inline loader`, fakeAsync(() => {
      const spy = jasmine.createSpy();
      service.selectTranslate('title', {}, inlineScope).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('Todos Title English');
    }));
    it(`GIVEN a TranslocoService with scoped translations loaded
        WHEN subscribing to selectTranslate with a scope object and dynamic parameters
        THEN should emit the scoped translation with interpolated parameter values`, fakeAsync(() => {
      const spy = jasmine.createSpy();
      service
        .selectTranslate(
          'withParam',
          { param: 'Transloco' },
          { scope: 'lazy-page' },
        )
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
    }));

    describe('Scope/lang arrays', () => {
      it(`GIVEN a TranslocoService with scoped translations loaded
          WHEN subscribing to selectTranslate with an array of scope objects and parameters
          THEN should emit the scoped translation with interpolated parameter values`, fakeAsync(() => {
        const spy = jasmine.createSpy();
        service
          .selectTranslate('withParam', { param: 'Transloco' }, [
            { scope: 'lazy-page' },
          ])
          .subscribe(spy);
        runLoader();
        expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
      }));

      it(`GIVEN a TranslocoService with scoped translations loaded
          WHEN subscribing to selectTranslate with an array of scope strings and parameters
          THEN should emit the scoped translation with interpolated parameter values`, fakeAsync(() => {
        const spy = jasmine.createSpy();
        service
          .selectTranslate('withParam', { param: 'Transloco' }, ['lazy-page'])
          .subscribe(spy);
        runLoader();
        expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
        service
          .selectTranslate('params', { value: 'Transloco' }, [
            'transpilers/messageformat/es',
          ])
          .subscribe(spy);
        runLoader();
        expect(spy).toHaveBeenCalledWith(
          'Replaces standard Transloco - spanish',
        );
      }));

      it(`GIVEN a TranslocoService with autoPrefixKeys=false
          WHEN subscribing to selectTranslate with an array of scope objects using inline loaders
          THEN should resolve the correct translations and translate the scoped key`, fakeAsync(() => {
        TestBed.resetTestingModule();
        service = createService({
          scopes: {
            autoPrefixKeys: false,
          },
        });

        const spy = jasmine.createSpy();
        const desiredScope = {
          scope: 'lazy-page',
          loader: {
            en: () => Promise.resolve({ message: 'lazy-message' }),
          },
        };
        const otherScope = {
          scope: 'other-page',
          loader: {
            en: () => Promise.resolve({ message: 'other-message' }),
          },
        };

        service
          .selectTranslate('lazyPage.message', {}, [otherScope, desiredScope])
          .subscribe(spy);

        runLoader();

        expect(spy).toHaveBeenCalledWith('lazy-message');
      }));
    });
  });
});
