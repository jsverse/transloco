import { fakeAsync } from '@angular/core/testing';

import { createService, mockLangs } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './service-spec-utils';

describe('translate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN a TranslocoService instance
      WHEN translating falsy values (empty string, null, undefined)
      THEN should return the falsy value as-is`, () => {
    expect(service.translate('')).toEqual('');
    expect(service.translate(null as any)).toEqual(null as any);
    expect(service.translate(undefined as any)).toEqual(undefined as any);
  });

  it(`GIVEN a TranslocoService instance
      WHEN translating a key before and after loading translations
      THEN should return the key when translation doesn't exist and the translated value when it exists`, fakeAsync(() => {
    expect(service.translate('home')).toEqual('home');
    loadLang(service);
    expect(service.translate('home')).toEqual(mockLangs['en'].home);
    service.setActiveLang('es');

    expect(service.translate('home')).toEqual('home');
  }));

  it(`GIVEN a TranslocoService with loaded translations and a spied missing handler
      WHEN translating non-existent keys
      THEN should call the missing handler once for each missing translation`, fakeAsync(() => {
    spyOn((service as any).missingHandler, 'handle').and.callThrough();
    loadLang(service);
    service.translate('kazaz');
    service.translate('netanel');
    service.translate('itay');
    expect((service as any).missingHandler.handle).toHaveBeenCalledTimes(3);
  }));

  it(`GIVEN a TranslocoService with English translations loaded
      WHEN translating various keys (simple, with params, nested paths, arrays)
      THEN should return correct translations for all key types`, fakeAsync(() => {
    loadLang(service);
    const eng = mockLangs['en'];
    expect(service.translate('home')).toEqual(eng.home);
    expect(service.translate('alert', { value: 'val' })).toEqual(
      'alert val english',
    );
    expect(service.translate('a.b.c')).toEqual('a.b.c from list english');
    expect(service.translate('key.is.like.path')).toEqual('key is like path');
    expect(service.translate('array')).toEqual(['hello-1', 'hello-2']);
  }));

  it(`GIVEN a TranslocoService with English translations loaded
      WHEN translating an array of keys (some exist, some don't)
      THEN should return an array with translated values for existing keys and original keys for missing ones`, fakeAsync(() => {
    loadLang(service);
    const expected = ['home english', 'a.b.c from list english', 'notexists'];
    expect(service.translate(['home', 'a.b.c', 'notexists'])).toEqual(expected);
  }));

  it(`GIVEN a TranslocoService with English translations loaded
      WHEN translating an array of keys with dynamic parameter values
      THEN should return an array with interpolated parameter values`, fakeAsync(() => {
    loadLang(service);
    const expected = [
      'home english',
      'alert val english',
      'a.b.c from list english',
    ];
    expect(
      service.translate(['home', 'alert', 'a.b.c'], { value: 'val' }),
    ).toEqual(expected);
  }));

  it(`GIVEN a TranslocoService with a scoped language (lazy-page/en) loaded
      WHEN translating a key with a scope parameter
      THEN should return the translation from the scoped language file`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it(`GIVEN a TranslocoService with multiple scoped languages loaded
      WHEN translating a key with an explicit scope/language combination
      THEN should return the translation from the specified scope and language`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    loadLang(service, 'lazy-page/es');
    expect(service.translate('title', {}, 'lazy-page/es')).toEqual(
      'Admin Lazy spanish',
    );
  }));
});

describe('translate - scope auto prefix', () => {
  let service: TranslocoService;

  beforeEach(
    () =>
      (service = createService({
        scopes: {
          autoPrefixKeys: true,
          keepCasing: false,
        },
      })),
  );

  it(`GIVEN a TranslocoService with autoPrefixKeys enabled and lazy-page/en loaded
      WHEN translating a simple key with a scope
      THEN should automatically prefix the scope to the key and resolve correctly`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' becomes 'lazyPage.title' and resolves correctly
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys enabled and lazy-page/en loaded
      WHEN translating a key that already includes the scope prefix with a scope parameter
      THEN should double-prefix the scope and return the malformed key`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'lazyPage.title' becomes 'lazyPage.lazyPage.title' which doesn't exist
    // This demonstrates the problem that autoPrefixKeys: false solves
    const doublePrefixedKey = 'lazyPage.lazyPage.title';
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      doublePrefixedKey,
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys enabled and lazy-page/en loaded
      WHEN translating an array of simple keys with a scope
      THEN should automatically prefix scope to all keys`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' becomes 'lazyPage.title', 'notexists' becomes 'lazyPage.notexists'
    const result = ['Admin Lazy english', 'lazyPage.notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      result,
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys enabled and lazy-page/en loaded
      WHEN translating an array of keys that already include the scope prefix
      THEN should double-prefix scope to all keys and return malformed keys`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // Both keys get double-prefixed and don't exist, returning fallback keys
    const doublePrefixedKeys = [
      'lazyPage.lazyPage.title',
      'lazyPage.lazyPage.notexists',
    ];
    expect(
      service.translate(
        ['lazyPage.title', 'lazyPage.notexists'],
        {},
        'lazy-page',
      ),
    ).toEqual(doublePrefixedKeys);
  }));
});

describe('translate - scope not auto prefix', () => {
  let service: TranslocoService;

  beforeEach(
    () =>
      (service = createService({
        scopes: {
          autoPrefixKeys: false,
          keepCasing: false,
        },
      })),
  );

  it(`GIVEN a TranslocoService with autoPrefixKeys disabled and lazy-page/en loaded
      WHEN translating a simple key with a scope
      THEN should not auto-prefix the key and return the original key as fallback`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' stays as 'title' (no auto-prefix), doesn't exist in root, returns key as fallback
    const untranslatedKey = 'title';
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      untranslatedKey,
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys disabled and lazy-page/en loaded
      WHEN translating a key with manually included scope prefix
      THEN should resolve the translation correctly without adding additional prefix`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'lazyPage.title' stays as 'lazyPage.title' (no auto-prefix) and resolves correctly
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys disabled and lazy-page/en loaded
      WHEN translating an array of simple keys with a scope
      THEN should not auto-prefix any keys and return original keys as fallback`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // Keys stay as-is without auto-prefix, returning fallback keys when not found
    const untranslatedKeys = ['title', 'notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      untranslatedKeys,
    );
  }));

  it(`GIVEN a TranslocoService with autoPrefixKeys disabled and lazy-page/en loaded
      WHEN translating an array of keys with manually included scope prefix
      THEN should resolve existing translations correctly`, fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // Keys with manual scope prefix resolve correctly without auto-prefix
    const result = ['Admin Lazy english', 'lazyPage.notexists'];
    expect(
      service.translate(
        ['lazyPage.title', 'lazyPage.notexists'],
        {},
        'lazy-page',
      ),
    ).toEqual(result);
  }));
});
