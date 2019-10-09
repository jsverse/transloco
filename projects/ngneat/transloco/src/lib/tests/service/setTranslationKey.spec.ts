import { fakeAsync } from '@angular/core/testing';
import { createService } from '../transloco.mocks';
import { loadLang } from './utils';

describe('setTranslationKey', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should override key', fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a', 'new value');
    const newTranslation = service.getTranslation('en');
    expect(newTranslation.a).toEqual('new value');
  }));

  it('should deep override key', fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a.b.c', 'new value');
    const newTranslation = service.getTranslation('en');
    expect(newTranslation['a.b.c']).toEqual('new value');
  }));

  it('should add it even if lang not exists', fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a', 'new value', 'es');
    expect((service as any).getTranslation('es')).toEqual({
      a: 'new value'
    });
  }));
});
