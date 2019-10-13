import { fakeAsync } from '@angular/core/testing';
import { loadLang } from './utils';
import { createService } from '../transloco.mocks';

describe('translateObject', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should return an object', fakeAsync(() => {
    loadLang(service);
    expect(service.translateObject('a')).toEqual({ b: { c: 'a.b.c {{fromList}} english' } });
  }));

  it('should return a nested object', fakeAsync(() => {
    loadLang(service);
    expect(service.translateObject('a.b')).toEqual({ c: 'a.b.c {{fromList}} english' });
  }));

  it('should should support params', fakeAsync(() => {
    loadLang(service);
    expect(service.translateObject('a.b', { c: { fromList: 'Hello' } })).toEqual({ c: 'a.b.c Hello english' });
  }));
});
