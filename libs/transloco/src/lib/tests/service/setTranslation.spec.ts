import { fakeAsync } from '@angular/core/testing';

import { Translation } from '../../transloco.types';
import { TranslocoService } from '../../transloco.service';
import { createService, mockLangs } from '../mocks';
import { flatten } from '../../utils/flat.utils';

import { loadLang } from './service-spec-utils';

describe('setTranslation', () => {
  let service: TranslocoService;
  let setTranslationsSpy: jasmine.Spy;

  beforeEach(() => {
    service = createService();
    setTranslationsSpy = spyOn(
      (service as any).translations,
      'set',
    ).and.callThrough();
  });

  it(`GIVEN a TranslocoService instance
      WHEN setting a translation with setTranslation
      THEN should add the translation to the map after passing through the interceptor`, () => {
    const interceptorSpy = spyOn(
      (service as any).interceptor,
      'preSaveTranslation',
    ).and.callThrough();
    const lang = 'en';
    const translation = flatten(mockLangs[lang]);
    service.setTranslation(translation, lang);
    expect(interceptorSpy).toHaveBeenCalledWith(translation, lang);
    expect(setTranslationsSpy).toHaveBeenCalledWith(lang, translation);
    expect(setTranslationsSpy).toHaveBeenCalledTimes(1);
  });

  it(`GIVEN a TranslocoService with loaded translations
      WHEN setting a translation without the merge option
      THEN should merge the new data with existing translations by default`, fakeAsync(() => {
    loadLang(service);
    const translation = { bar: 'bar' };
    service.setTranslation(translation);
    const newTranslation = service.getTranslation('en');

    expect(newTranslation.bar).toEqual('bar');
    expect(newTranslation.home).toEqual('home english');
  }));

  it(`GIVEN a TranslocoService with loaded translations
      WHEN setting a translation with merge: false
      THEN should replace the current translation entirely with the new translation`, fakeAsync(() => {
    loadLang(service);
    const translation = { newKey: 'a', newKeyTwo: 'b' };
    service.setTranslation(translation, 'en', { merge: false });
    const newTranslation = service.getTranslation('en');
    expect(newTranslation).toEqual({ newKey: 'a', newKeyTwo: 'b' });
  }));

  it(`GIVEN a TranslocoService with loaded translations
      WHEN setting a translation with emitChange: false
      THEN should not emit the language change event`, fakeAsync(() => {
    loadLang(service);
    spyOn(service, 'setActiveLang');
    const translation = { kazaz: 'blabla' };
    service.setTranslation(translation, 'en', { emitChange: false });
    expect(service.setActiveLang).not.toHaveBeenCalled();
  }));

  it(`GIVEN a TranslocoService with existing translations
      WHEN setting a translation for a language that doesn't exist yet
      THEN should add the new language with its translation`, fakeAsync(() => {
    loadLang(service);
    service.setTranslation({ home: 'home es' }, 'es');
    expect(service.getTranslation('es').home).toEqual('home es');
  }));

  describe('scopes', () => {
    let lang: string;
    let translation: Translation;

    beforeEach(() => {
      (service as any).translations.set('en', mockLangs.en);
      lang = 'lazy-page/en';
      translation = mockLangs[lang];
    });

    it(`GIVEN a TranslocoService with global language translations
        WHEN setting a scoped translation
        THEN should merge the scope with the scope's global language`, () => {
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ lazyPage: { ...translation } }),
      };
      expect(setTranslationsSpy).toHaveBeenCalledWith('en', merged);
    });

    it(`GIVEN a TranslocoService with scopeMapping configured
        WHEN setting a scoped translation with a mapped scope
        THEN should map the scope's name in the merged translation`, () => {
      service.config.scopeMapping = { 'lazy-page': 'kazaz' };
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ kazaz: { ...translation } }),
      };
      expect(setTranslationsSpy).toHaveBeenCalledWith('en', merged);
    });

    it(`GIVEN a TranslocoService with a scope alias configured
        WHEN setting a scoped translation
        THEN should change scope's name based on the alias`, () => {
      service._setScopeAlias('lazy-page', 'myScopeAlias');
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ myScopeAlias: { ...translation } }),
      };
      expect(setTranslationsSpy).toHaveBeenCalledWith('en', merged);
    });

    it(`GIVEN a TranslocoService with scope.keepCasing set to true
        WHEN setting a scoped translation
        THEN should not change scope's name casing and preserve it as-is`, () => {
      service.config.scopes.keepCasing = true;
      lang = 'LAZY-page/en';
      service.setTranslation(translation, lang);
      const merged = {
        ...flatten(mockLangs.en),
        ...flatten({ 'LAZY-page': { ...translation } }),
      };
      expect(setTranslationsSpy).toHaveBeenCalledWith('en', merged);
    });
  });
});
