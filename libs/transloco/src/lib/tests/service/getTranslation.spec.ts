import { fakeAsync } from '@angular/core/testing';
import { flatten } from '../../helpers';
import { TranslocoService } from '../../transloco.service';
import { createService, mockLangs } from '../mocks';
import { loadLang } from './utils';

describe('getTranslation', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should return an empty object when no translations loaded', () => {
    expect(service.getTranslation('en')).toEqual({});
    expect(service.getTranslation('es')).toEqual({});
  });

  it('should return the translation flatten', fakeAsync(() => {
    loadLang(service);
    expect(service.getTranslation('en')).toEqual(flatten(mockLangs['en']));
  }));

  it('should return the scope translation flatten', fakeAsync(() => {
    const lang = 'lazy-page/es';
    loadLang(service, lang);
    expect(service.getTranslation(lang)).toEqual(flatten(mockLangs[lang]));
  }));

  it('should return the translations map', fakeAsync(() => {
    loadLang(service);
    loadLang(service, 'es');
    const map = service.getTranslation();
    expect(map instanceof Map).toEqual(true);
    expect(map.get('en')).toEqual(flatten(mockLangs['en']));
    expect(map.get('es')).toEqual(flatten(mockLangs['es']));
  }));
});
