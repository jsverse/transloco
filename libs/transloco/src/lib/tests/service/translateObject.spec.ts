import { fakeAsync } from '@angular/core/testing';

import { createService } from '../mocks';
import { TranslocoService } from '../../transloco.service';
import { HashMap } from '../../utils/type.utils';

import { loadLang } from './service-spec-utils';

describe('translateObject', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  describe('The translation value is an object', () => {
    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a key that resolves to an object
        THEN should return the nested translation object`, fakeAsync(() => {
      loadLang(service);
      expect(service.translateObject('a')).toEqual({
        b: { c: 'a.b.c {{fromList}} english' },
      });
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a nested path key
        THEN should return the nested translation object`, fakeAsync(() => {
      loadLang(service);
      expect(service.translateObject('a.b')).toEqual({
        c: 'a.b.c {{fromList}} english',
      });
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a nested key and nested parameters
        THEN should return the translation object with interpolated parameter values`, fakeAsync(() => {
      loadLang(service);
      expect(
        service.translateObject('a.b', { c: { fromList: 'Hello' } }),
      ).toEqual({
        c: 'a.b.c Hello english',
      });
    }));
  });

  describe('The key is an array', () => {
    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with an array of keys
        THEN should return an array of translation objects for each key`, fakeAsync(() => {
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
    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a key-params map object
        THEN should return an array with translations for each key`, fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { b: null, c: {} };
      expect(service.translateObject(keyParamsMap)).toEqual([
        'b english',
        'c english',
      ]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a key-params map for an object key
        THEN should return an array with the nested translation object`, fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { a: {} };
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c {{fromList}} english' } },
      ]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a key-params map that includes nested parameter keys
        THEN should support translation key referencing and reuse`, fakeAsync(() => {
      loadLang(service);
      const keyParamsMap = { a: { 'b.c': {} } };
      expect(service.translateObject(keyParamsMap)).toEqual([
        { b: { c: 'a.b.c from list english' } },
      ]);
    }));

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with a key-params map containing parameters
        THEN should return an array with translations interpolated with their respective parameters`, fakeAsync(() => {
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

    it(`GIVEN a TranslocoService with English translations loaded
        WHEN calling translateObject with an ES6 Map containing keys and parameters
        THEN should return an array with translation objects interpolated with their parameters`, fakeAsync(() => {
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
