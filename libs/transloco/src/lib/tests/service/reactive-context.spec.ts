import { computed } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';

import { createService, mockLangs } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './service-spec-utils';

describe('translate in a reactive context', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN a computed that calls translate() without an explicit language
      WHEN the active language changes
      THEN the computed should re-run and return the new language's translation`, fakeAsync(() => {
    loadLang(service);
    loadLang(service, 'es');

    const message = computed(() => service.translate('home'));
    expect(message()).toEqual(mockLangs['en'].home);

    service.setActiveLang('es');
    expect(message()).toEqual(mockLangs['es'].home);
  }));

  it(`GIVEN a computed that calls translate() with an explicit language
      WHEN the active language changes
      THEN the computed should keep returning the requested language's translation`, fakeAsync(() => {
    loadLang(service);
    loadLang(service, 'es');

    const message = computed(() => service.translate('home', {}, 'en'));
    expect(message()).toEqual(mockLangs['en'].home);

    service.setActiveLang('es');
    expect(message()).toEqual(mockLangs['en'].home);
  }));

  it(`GIVEN a computed that calls translateObject() without an explicit language
      WHEN the active language changes
      THEN the computed should re-run and return the new language's translation`, fakeAsync(() => {
    loadLang(service);
    loadLang(service, 'es');

    const nested = computed(() => service.translateObject('a.b'));
    expect(nested()).toEqual((mockLangs['en'] as any).a.b);

    service.setActiveLang('es');
    expect(nested()).toEqual((mockLangs['es'] as any).a.b);
  }));
});
