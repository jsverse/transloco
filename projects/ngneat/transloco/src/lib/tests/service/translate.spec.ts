import { createService, mockLangs } from '../transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { loadLang } from './utils';

describe('translate', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should return the key when it is falsy', () => {
    expect(service.translate('')).toEqual('');
    expect(service.translate(null)).toEqual(null);
    expect(service.translate(undefined)).toEqual(undefined);
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
    expect(service.translate('alert', { value: 'val' })).toEqual('alert val english');
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
    const expected = ['home english', 'alert val english', 'a.b.c from list english'];
    expect(service.translate(['home', 'alert', 'a.b.c'], { value: 'val' })).toEqual(expected);
  }));

  it('should support scoped language', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    // should append the active lang by default
    expect(service.translate('title', {}, 'lazy-page')).toEqual('Admin Lazy english');
  }));

  it('should support scoped language with different lang', fakeAsync(() => {
    loadLang(service, 'lazy-page/en');
    loadLang(service, 'lazy-page/es');
    expect(service.translate('title', {}, 'lazy-page/es')).toEqual('Admin Lazy spanish');
  }));
});
