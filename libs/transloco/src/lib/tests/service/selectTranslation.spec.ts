import { fakeAsync } from '@angular/core/testing';

import { createService, mockLangs, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';
import { flatten } from '../../utils/flat.utils';

describe('selectTranslation', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN service with scoped translation
      WHEN selectTranslation is called with scope and lang changes
      THEN should emit scoped translations for each lang`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('lazy-page').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/en']));
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/es']));
  }));

  it(`GIVEN service with active lang
      WHEN selectTranslation is called without lang and lang changes
      THEN should emit active translation for each lang`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation().subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['en']));
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['es']));
  }));

  it(`GIVEN service with specific lang
      WHEN selectTranslation is called with static lang
      THEN should emit once and not react to lang changes`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['es']));
    service.setActiveLang('en');
    runLoader();
    service.setActiveLang('es');
    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it(`GIVEN service with scoped translation and static lang
      WHEN selectTranslation is called with scope/lang
      THEN should emit once and not react to lang changes`, fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('lazy-page/es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/es']));
    service.setActiveLang('en');
    runLoader();
    service.setActiveLang('es');
    expect(spy).toHaveBeenCalledTimes(1);
  }));
});
