import { fakeAsync } from '@angular/core/testing';

import { createService } from '../mocks';
import { HashMap } from '../../types';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './utils';

describe('translateObject', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  describe('The translation value is an object', () => {
    it('should return an object', fakeAsync(() => {
      loadLang(service);
      expect(service.translateObject('a')).toEqual({
        b: { c: 'a.b.c {{fromList}} english' },
      });
    }));

    it('should return a nested object', fakeAsync(() => {
      loadLang(service);
      expect(service.translateObject('a.b')).toEqual({
        c: 'a.b.c {{fromList}} english',
      });
    }));

    it('should should support params', fakeAsync(() => {
      loadLang(service);
      expect(
        service.translateObject('a.b', { c: { fromList: 'Hello' } })
      ).toEqual({
        c: 'a.b.c Hello english',
      });
    }));
  });

  describe('The key is an array', () => {
    it('should return two objects', fakeAsync(() => {
      loadLang(service);
      expect(service.translateObject(['a', 'nested'])).toEqual([
        {
          b: { c: 'a.b.c {{fromList}} english' },
        },
        {
          title: 'Title english',
          desc: 'Desc english',
        },
      ]);
    }));
  });

  describe('The key is an object', () => {
    it('should return an array', fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { b: null, c: {} };
      expect(service.translateObject(keyParamsMap)).toEqual([
        'b english',
        'c english',
      ]);
    }));

    it('should support translating an object', fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { a: {} };
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c {{fromList}} english' } },
      ]);
    }));

    it('should support translation reuse', fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { a: { 'b.c': {} } };
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c from list english' } },
      ]);
    }));

    it('should should support params', fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = {
        a: { 'b.c': { fromList: 'bla' } },
        alert: { value: 'lang' },
      };
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c bla english' } },
        'alert lang english',
      ]);
    }));

    it('should support ES6 Map', fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = new Map<string, HashMap>([
        ['a', { 'b.c': { fromList: 'bla' } }],
        ['alert', { value: 'lang' }],
      ]);
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c bla english' } },
        'alert lang english',
      ]);
    }));
  });
});
