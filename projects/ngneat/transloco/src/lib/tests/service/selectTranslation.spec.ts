import { fakeAsync } from '@angular/core/testing';
import { createService, mockLangs, runLoader } from '../transloco.mocks';
import { flatten } from '@ngneat/transloco';

describe('selectTranslation', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should select the active translation lang', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation().subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['en']));
  }));

  it('should select the translation lang when passing one', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslation('es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith(flatten(mockLangs['es']));
  }));
});
