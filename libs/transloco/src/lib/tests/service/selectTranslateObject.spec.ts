import { fakeAsync } from '@angular/core/testing';

import { createService, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';
import { HashMap } from '../../utils/type.utils';

describe('selectTranslateObject', () => {
  let service: TranslocoService;
  let spy: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    service = createService();
    spy = jasmine.createSpy('translate subscription').and.callThrough();
  });

  describe('The translation value is an object', () => {
    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a key that resolves to an object
        THEN should emit an observable with the nested translation object`, fakeAsync(() => {
      service.selectTranslateObject('a').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({
        b: { c: 'a.b.c {{fromList}} english' },
      });
    }));

    it(`GIVEN a TranslocoService with scoped translations loaded
        WHEN subscribing to selectTranslateObject with a scope parameter
        THEN should emit the translation object from the scoped language file`, fakeAsync(() => {
      service.selectTranslateObject('obj', {}, 'lazy-page').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ a: { b: 'a.b english' } });
    }));

    it(`GIVEN a TranslocoService with scoped translations loaded
        WHEN subscribing to selectTranslateObject with explicit scope/language combination
        THEN should emit the translation object from the specified scope and language`, fakeAsync(() => {
      service.selectTranslateObject('obj', {}, 'lazy-page/es').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ a: { b: 'a.b spanish' } });
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a nested path key
        THEN should emit the nested translation object`, fakeAsync(() => {
      service.selectTranslateObject('a.b').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} english' });
    }));

    it(`GIVEN a TranslocoService with an active subscription to a translation object
        WHEN the active language is changed
        THEN should emit the updated translation object in the new language`, fakeAsync(() => {
      service.selectTranslateObject('a.b').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} english' });
      service.setActiveLang('es');
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} spanish' });
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a nested key and nested parameters
        THEN should emit the translation object with interpolated parameter values`, fakeAsync(() => {
      service
        .selectTranslateObject('a.b', { c: { fromList: 'Hello' } })
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c Hello english' });
    }));
  });

  describe('The key is an object', () => {
    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a key-params map object
        THEN should emit an array with translations for each key`, fakeAsync(() => {
      const keyParamsMap = { b: null, c: {} };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith(['b english', 'c english']);
    }));

    it(`GIVEN a TranslocoService with scoped translations loaded
        WHEN subscribing to selectTranslateObject with a key-params map and scope
        THEN should emit an array with translation objects from the scoped language file`, fakeAsync(() => {
      const keyParamsMap = { obj: null };
      service
        .selectTranslateObject(keyParamsMap, null, 'lazy-page')
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ a: { b: 'a.b english' } }]);
    }));

    it(`GIVEN a TranslocoService with scoped translations loaded
        WHEN subscribing to selectTranslateObject with a key-params map and explicit scope/language
        THEN should emit an array with translation objects from the specified scope and language`, fakeAsync(() => {
      const keyParamsMap = { obj: null };
      service
        .selectTranslateObject(keyParamsMap, null, 'lazy-page/es')
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ a: { b: 'a.b spanish' } }]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a key-params map containing nested paths
        THEN should emit an array with nested translation objects`, fakeAsync(() => {
      const keyParamsMap = { 'a.b': null };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} english' }]);
    }));

    it(`GIVEN a TranslocoService with an active subscription using a key-params map
        WHEN the active language is changed
        THEN should emit an array with updated translation objects in the new language`, fakeAsync(() => {
      const keyParamsMap = { 'a.b': null };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} english' }]);
      service.setActiveLang('es');
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} spanish' }]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with a key-params map containing parameters
        THEN should emit an array with translations interpolated with their respective parameters`, fakeAsync(() => {
      const keyParamsMap = {
        'a.b': { c: { fromList: 'Hello' } },
        alert: { value: 'lang' },
      };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([
        { c: 'a.b.c Hello english' },
        'alert lang english',
      ]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN subscribing to selectTranslateObject with an ES6 Map containing keys and parameters
        THEN should emit an array with translation objects interpolated with their parameters`, fakeAsync(() => {
      const keyParamsMap = new Map<string, HashMap>([
        ['a', { 'b.c': { fromList: 'bla' } }],
        ['alert', { value: 'lang' }],
      ]);
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader(3);
      expect(spy).toHaveBeenCalledWith([
        { b: { c: 'a.b.c bla english' } },
        'alert lang english',
      ]);
    }));
  });
});
