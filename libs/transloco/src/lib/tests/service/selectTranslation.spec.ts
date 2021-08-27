import { fakeAsync } from '@angular/core/testing';
import { createService, mockLangs, runLoader } from '../mocks';
import { flatten } from '../../helpers';
import { TranslocoService } from '../../transloco.service';

describe('selectTranslation', () => {
  let service: TranslocoService;

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
    service.setActiveLang('en');
    runLoader();
    service.setActiveLang('es');
    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it('should select the translation scope when passing one', fakeAsync(() => {
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
