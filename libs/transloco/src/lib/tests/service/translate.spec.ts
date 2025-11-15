import { fakeAsync } from '@angular/core/testing';

import { createService, mockLangs } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './service-spec-utils';

describe('translate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should return the key when it is falsy', () => {
    expect(service.translate('')).toEqual('');
    expect(service.translate(null as any)).toEqual(null as any);
    expect(service.translate(undefined as any)).toEqual(undefined as any);
  });

  it('should return the value or the key based on the translation existing', fakeAsync(() => {
    expect(service.translate('home')).toEqual('home');
    loadLang(service);
    expect(service.translate('home')).toEqual(mockLangs['en'].home);
    service.setActiveLang('es');

    expect(service.translate('home')).toEqual('home');
  }));

  it('should call missing handler when there is no translation for the key', fakeAsync(() => {
    spyOn((service as any).missingHandler, 'handle').and.callThrough();
    loadLang(service);
    service.translate('kazaz');
    service.translate('netanel');
    service.translate('itay');
    expect((service as any).missingHandler.handle).toHaveBeenCalledTimes(3);
  }));

  it('should translate', fakeAsync(() => {
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

  it('should support multi key translation', fakeAsync(() => {
    loadLang(service);
    const expected = ['home english', 'a.b.c from list english', 'notexists'];
    expect(service.translate(['home', 'a.b.c', 'notexists'])).toEqual(expected);
  }));

  it('should support multi key translation with dynamic values', fakeAsync(() => {
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

  it('should support scoped language', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it('should support scoped language with different lang', fakeAsync(() => {
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

  it('should auto-prefix scope to simple keys when scope is provided', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' becomes 'lazyPage.title' and resolves correctly
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it('should result in double-prefixed key when scope is manually included (current behavior)', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'lazyPage.title' becomes 'lazyPage.lazyPage.title' which doesn't exist
    // This demonstrates the problem that autoPrefixKeys: false solves
    const doublePrefixedKey = 'lazyPage.lazyPage.title';
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      doublePrefixedKey,
    );
  }));

  it('should auto-prefix scope to all keys in multi-key array', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' becomes 'lazyPage.title', 'notexists' becomes 'lazyPage.notexists'
    const result = ['Admin Lazy english', 'lazyPage.notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      result,
    );
  }));

  it('should result in double-prefixed keys in array when scope is manually included', fakeAsync(() => {
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

  it('should not auto-prefix scope, returning original key when translation not found', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'title' stays as 'title' (no auto-prefix), doesn't exist in root, returns key as fallback
    const untranslatedKey = 'title';
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      untranslatedKey,
    );
  }));

  it('should resolve translation when scope is manually included in key', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // 'lazyPage.title' stays as 'lazyPage.title' (no auto-prefix) and resolves correctly
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it('should not auto-prefix scope to keys in multi-key array', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // Keys stay as-is without auto-prefix, returning fallback keys when not found
    const untranslatedKeys = ['title', 'notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      untranslatedKeys,
    );
  }));

  it('should resolve translations when scope is manually included in array keys', fakeAsync(() => {
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
