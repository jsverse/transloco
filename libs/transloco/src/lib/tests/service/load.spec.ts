import { fakeAsync } from '@angular/core/testing';
import { filter, map } from 'rxjs';

import { createService, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';

import { loadLang } from './service-spec-utils';

describe('load', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN service loading translations
      WHEN translations finish loading
      THEN should trigger translationLoadSuccess event`, fakeAsync(() => {
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

  it(`GIVEN service loading scoped translations
      WHEN scoped translations finish loading
      THEN should trigger translationLoadSuccess event with scope`, fakeAsync(() => {
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

  it(`GIVEN service loading translations
      WHEN translations finish loading
      THEN should trigger langChanged event`, fakeAsync(() => {
    service.events$
      .pipe(filter((e: any) => e.type === 'langChanged'))
      .subscribe((event) => {
        expect(event.type).toEqual('langChanged');
      });
    loadLang(service, 'admin-page/en');
  }));

  it(`GIVEN service with configured loader
      WHEN load is called
      THEN should use loader to fetch translations`, fakeAsync(() => {
    const loaderSpy = spyOn(
      (service as any).loader,
      'getTranslation',
    ).and.callThrough();
    service.load('en').subscribe();
    runLoader();
    expect(loaderSpy).toHaveBeenCalledWith('en', undefined);
    expect((service as any).translations.size).toEqual(1);
  }));

  it(`GIVEN translations already loaded
      WHEN load is called again
      THEN should return cached translations without calling loader`, fakeAsync(() => {
    loadLang(service);
    spyOn((service as any).loader, 'getTranslation').and.callThrough();
    service.load('en');
    expect((service as any).loader.getTranslation).not.toHaveBeenCalled();
  }));
});
