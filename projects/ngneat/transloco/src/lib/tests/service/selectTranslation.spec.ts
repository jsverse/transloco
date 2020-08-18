import { fakeAsync } from '@angular/core/testing';
import { createService, mockLangs, runLoader } from '../transloco.mocks';
import { flatten } from '@ngneat/transloco';

describe('selectTranslation', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should select the active translation scope', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('lazy-page').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/en']));
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/es']));
  }));

  it('should select the active translation lang', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation().subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['en']));
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['es']));
  }));

  it('should select the translation lang when passing one', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['es']));
  }));

  it('should select the translation scope when passing one', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('lazy-page/es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['lazy-page/es']));
  }));
});
