import { fakeAsync } from '@angular/core/testing';
import { filter, pluck } from 'rxjs/operators';
import { createService, runLoader } from '../mocks';
import { loadLang } from './utils';
import { TranslocoService } from '../../transloco.service';

describe('load', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should trigger loaded event once loaded', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.events$
      .pipe(
        filter((e: any) => e.type === 'translationLoadSuccess'),
        pluck('payload')
      )
      .subscribe(spy);
    loadLang(service);
    expect(spy).toHaveBeenCalledWith({
      lang: 'en',
      langName: 'en',
      scope: null,
    });
  }));

  it('should trigger loaded event once loaded - scope', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.events$
      .pipe(
        filter((e: any) => e.type === 'translationLoadSuccess'),
        pluck('payload')
      )
      .subscribe(spy);
    loadLang(service, 'admin-page/en');
    expect(spy).toHaveBeenCalledWith({
      lang: 'admin-page/en',
      langName: 'en',
      scope: 'admin-page',
    });
  }));

  it('should load the translation using the loader', fakeAsync(() => {
    const loaderSpy = spyOn(
      (service as any).loader,
      'getTranslation'
    ).and.callThrough();
    service.load('en').subscribe();
    runLoader();
    expect(loaderSpy).toHaveBeenCalledWith('en', undefined);
    expect((service as any).translations.size).toEqual(1);
  }));

  it('should load the translation from cache', fakeAsync(() => {
    loadLang(service);
    spyOn((service as any).loader, 'getTranslation').and.callThrough();
    service.load('en');
    expect((service as any).loader.getTranslation).not.toHaveBeenCalled();
  }));
});
