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

  it('should support auto prefix when scoped language is provided', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it('should auto prefix when scoped language is provided even when if the scope is already in the original', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      'lazyPage.lazyPage.title',
    );
  }));

  it('should support auto prefix when is multi key translation and when scoped language is provided', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    const expected = ['Admin Lazy english', 'lazyPage.notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      expected,
    );
  }));

  it('should not support auto prefix when is multi key translation and when scoped language is provided and the scope is also provided in the key', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    const expected = ['lazyPage.lazyPage.title', 'lazyPage.lazyPage.notexists'];
    expect(
      service.translate(
        ['lazyPage.title', 'lazyPage.notexists'],
        {},
        'lazy-page',
      ),
    ).toEqual(expected);
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

  it('should keep the original key when scoped language is provided', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('title', {}, 'lazy-page')).toEqual('title');
  }));

  it('should support when scoped language is provided and the scope is provided in the key', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('lazyPage.title', {}, 'lazy-page')).toEqual(
      'Admin Lazy english',
    );
  }));

  it('should support to not auto prefix when is multi key translation and when scoped language is provided', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    const expected = ['title', 'notexists'];
    expect(service.translate(['title', 'notexists'], {}, 'lazy-page')).toEqual(
      expected,
    );
  }));

  it('should support to not auto prefix when is multi key translation and when scoped language is provided and the scope is also provided in the key', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    const expected = ['Admin Lazy english', 'lazyPage.notexists'];
    expect(
      service.translate(
        ['lazyPage.title', 'lazyPage.notexists'],
        {},
        'lazy-page',
      ),
    ).toEqual(expected);
  }));
});
