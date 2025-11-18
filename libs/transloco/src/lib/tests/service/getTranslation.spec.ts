import { fakeAsync } from '@angular/core/testing';

import { TranslocoService } from '../../transloco.service';
import { createService, mockLangs } from '../mocks';
import { flatten } from '../../utils/flat.utils';

import { loadLang } from './service-spec-utils';

describe('getTranslation', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN service with no loaded translations
      WHEN getTranslation is called
      THEN should return an empty object`, () => {
    expect(service.getTranslation('en')).toEqual({});
    expect(service.getTranslation('es')).toEqual({});
  });

  it(`GIVEN service with loaded translations
      WHEN getTranslation is called for a lang
      THEN should return flattened translation`, fakeAsync(() => {
    loadLang(service);
    expect(service.getTranslation('en')).toEqual(flatten(mockLangs['en']));
  }));

  it(`GIVEN service with loaded scoped translations
      WHEN getTranslation is called for scoped lang
      THEN should return flattened scoped translation`, fakeAsync(() => {
    const lang = 'lazy-page/es';
    loadLang(service, lang);
    expect(service.getTranslation(lang)).toEqual(flatten(mockLangs[lang]));
  }));

  it(`GIVEN service with multiple loaded translations
      WHEN getTranslation is called without lang
      THEN should return map of all translations`, fakeAsync(() => {
    loadLang(service);
    loadLang(service, 'es');
    const map = service.getTranslation();
    expect(map instanceof Map).toEqual(true);
    expect(map.get('en')).toEqual(flatten(mockLangs['en']));
    expect(map.get('es')).toEqual(flatten(mockLangs['es']));
  }));
});
