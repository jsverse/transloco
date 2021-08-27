import { fakeAsync } from '@angular/core/testing';
import { createService, runLoader } from '../mocks';
import { HashMap } from '../../types';
import { TranslocoService } from '../../transloco.service';

describe('selectTranslateObject', () => {
  let service: TranslocoService;
  let spy: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    service = createService();
    spy = jasmine.createSpy('translate subscription').and.callThrough();
  });

  describe('The translation value is an object', () => {
    it('should return an object', fakeAsync(() => {
      service.selectTranslateObject('a').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({
        b: { c: 'a.b.c {{fromList}} english' },
      });
    }));

    it('should work with scope', fakeAsync(() => {
      service.selectTranslateObject('obj', {}, 'lazy-page').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ a: { b: 'a.b english' } });
    }));

    it('should work with scope and lang', fakeAsync(() => {
      service.selectTranslateObject('obj', {}, 'lazy-page/es').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ a: { b: 'a.b spanish' } });
    }));

    it('should return a nested object', fakeAsync(() => {
      service.selectTranslateObject('a.b').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} english' });
    }));

    it('should listen to lang changes', fakeAsync(() => {
      service.selectTranslateObject('a.b').subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} english' });
      service.setActiveLang('es');
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c {{fromList}} spanish' });
    }));

    it('should support params', fakeAsync(() => {
      service
        .selectTranslateObject('a.b', { c: { fromList: 'Hello' } })
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith({ c: 'a.b.c Hello english' });
    }));
  });

  describe('The key is an object', () => {
    it('should return an array', fakeAsync(() => {
      const keyParamsMap = { b: null, c: {} };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith(['b english', 'c english']);
    }));

    it('should work with scope', fakeAsync(() => {
      const keyParamsMap = { obj: null };
      service
        .selectTranslateObject(keyParamsMap, null, 'lazy-page')
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ a: { b: 'a.b english' } }]);
    }));

    it('should work with scope and lang', fakeAsync(() => {
      const keyParamsMap = { obj: null };
      service
        .selectTranslateObject(keyParamsMap, null, 'lazy-page/es')
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ a: { b: 'a.b spanish' } }]);
    }));

    it('should return a nested object', fakeAsync(() => {
      const keyParamsMap = { 'a.b': null };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} english' }]);
    }));

    it('should listen to lang changes', fakeAsync(() => {
      const keyParamsMap = { 'a.b': null };
      service.selectTranslateObject(keyParamsMap).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} english' }]);
      service.setActiveLang('es');
      runLoader();
      expect(spy).toHaveBeenCalledWith([{ c: 'a.b.c {{fromList}} spanish' }]);
    }));

    it('should support params', fakeAsync(() => {
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

    it('should support ES6 Map', fakeAsync(() => {
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
