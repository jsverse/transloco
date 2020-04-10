import { createService, mockLangs } from '../transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { loadLang } from './utils';
import { flatten } from '../../helpers';

describe('setTranslation', () => {
  let service;

  beforeEach(() => {
    service = createService();
    spyOn(service.translations, 'set').and.callThrough();
  });

  it('should add translation to the map after passing through the interceptor', () => {
    spyOn(service.interceptor, 'preSaveTranslation').and.callThrough();
    const lang = 'en';
    const translation = flatten(mockLangs[lang]);
    service.setTranslation(translation, lang);
    expect(service.interceptor.preSaveTranslation).toHaveBeenCalledWith(translation, lang);
    expect(service.translations.set).toHaveBeenCalledWith(lang, translation);
    expect(service.translations.set).toHaveBeenCalledTimes(1);
  });

  it('should merge the data by default', fakeAsync(() => {
    loadLang(service);
    const translation = { bar: 'bar' };
    service.setTranslation(translation);
    const newTranslation = service.getTranslation('en');

    expect(newTranslation.bar).toEqual('bar');
    expect(newTranslation.home).toEqual('home english');
  }));

  it('should replace the current translation when merge is false', fakeAsync(() => {
    loadLang(service);
    const translation = { newKey: 'a', newKeyTwo: 'b' };
    service.setTranslation(translation, 'en', { merge: false });
    const newTranslation = service.getTranslation('en');
    expect(newTranslation).toEqual({ newKey: 'a', newKeyTwo: 'b' });
  }));

  it('should not emit the change', fakeAsync(() => {
    loadLang(service);
    spyOn(service, 'setActiveLang');
    const translation = { kazaz: 'blabla' };
    service.setTranslation(translation, 'en', { emitChange: false });
    expect(service.setActiveLang).not.toHaveBeenCalled();
  }));

  it('should add the lang if it not exists', fakeAsync(() => {
    loadLang(service);
    service.setTranslation({ home: 'home es' }, 'es');
    expect(service.getTranslation('es').home).toEqual('home es');
  }));

  describe('scopes', () => {
    let lang, translation;

    beforeEach(() => {
      service.translations.set('en', mockLangs.en);
      lang = 'lazy-page/en';
      translation = mockLangs[lang];
    });

    it("should merge the scope with the scope's global lang", () => {
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ lazyPage: { ...translation } })
      };
      expect(service.translations.set).toHaveBeenCalledWith('en', merged);
    });

    it("should map the scope's name in the merged translation", () => {
      service.mergedConfig.scopeMapping = { 'lazy-page': 'kazaz' };
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ kazaz: { ...translation } })
      };
      expect(service.translations.set).toHaveBeenCalledWith('en', merged);
    });

    it("should change scope's name based on alias", () => {
      service._setScopeAlias('lazy-page', 'myScopeAlias');
      service.setTranslation(translation, lang);
      const merged = { ...flatten(mockLangs.en), ...flatten({ myScopeAlias: { ...translation } }) };
      expect(service.translations.set).toHaveBeenCalledWith('en', merged);
    });
  });
});
