import { fakeAsync } from '@angular/core/testing';

import { createService } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './service-spec-utils';

describe('setTranslationKey', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN service with loaded translations
      WHEN setTranslationKey is called
      THEN should override the key value`, fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a', 'new value');
    const newTranslation = service.getTranslation('en');
    expect(newTranslation.a).toEqual('new value');
  }));

  it(`GIVEN service with loaded translations
      WHEN setTranslationKey is called with nested key
      THEN should override the nested key value`, fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a.b.c', 'new value');
    const newTranslation = service.getTranslation('en');
    expect(newTranslation['a.b.c']).toEqual('new value');
  }));

  it(`GIVEN service without specific lang loaded
      WHEN setTranslationKey is called with lang option
      THEN should create lang and add the key`, fakeAsync(() => {
    loadLang(service);
    service.setTranslationKey('a', 'new value', { lang: 'es' });
    expect((service as any).getTranslation('es')).toEqual({
      a: 'new value',
    });
  }));

  it(`GIVEN service with loaded translations
      WHEN setTranslationKey is called with emitChange false
      THEN should not emit lang change event`, fakeAsync(() => {
    loadLang(service);
    spyOn(service, 'setActiveLang');
    service.setTranslationKey('a.b', 'newValue', {
      emitChange: false,
      lang: 'en',
    });
    expect(service.setActiveLang).not.toHaveBeenCalled();
  }));
});
