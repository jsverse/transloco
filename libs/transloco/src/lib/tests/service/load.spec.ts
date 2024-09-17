import { fakeAsync } from '@angular/core/testing';
import { filter, map } from 'rxjs';

import { createService, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './utils';

describe('load', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should trigger loaded event once loaded', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.events$
      .pipe(
        filter((e: any) => e.type === 'translationLoadSuccess'),
        map((e) => e.payload),
      )
      .subscribe(spy);
    loadLang(service);
    expect(spy).toHaveBeenCalledWith({
      langName: 'en',
      scope: null,
    });
  }));

  it('should trigger loaded event once loaded - scope', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.events$
      .pipe(
        filter((e: any) => e.type === 'translationLoadSuccess'),
        map((e) => e.payload),
      )
      .subscribe(spy);
    loadLang(service, 'admin-page/en');
    expect(spy).toHaveBeenCalledWith({
      langName: 'en',
      scope: 'admin-page',
    });
  }));

  it('should trigger lang changed once loaded', fakeAsync(() => {
    service.events$
      .pipe(filter((e: any) => e.type === 'langChanged'))
      .subscribe((event) => {
        expect(event.type).toEqual('langChanged');
      });
    loadLang(service, 'admin-page/en');
  }));

  it('should load the translation using the loader', fakeAsync(() => {
    const loaderSpy = spyOn(
      (service as any).loader,
      'getTranslation',
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
