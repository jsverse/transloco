import { fakeAsync } from '@angular/core/testing';
import { createService, mockLangs } from '../transloco.mocks';
import { loadLang } from './utils';
import { flatten } from '../../helpers';

describe('getTranslation', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should return an empty object when no translations loaded', () => {
    expect(service.getTranslation('en')).toEqual({});
    expect(service.getTranslation('es')).toEqual({});
  });

  it('should return the translation flatten', fakeAsync(() => {
    loadLang(service);
    expect(service.getTranslation('en')).toEqual(flatten(mockLangs['en']));
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
