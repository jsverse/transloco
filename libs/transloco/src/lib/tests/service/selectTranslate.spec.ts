import { fakeAsync } from '@angular/core/testing';

import { createService, runLoader, inlineScope } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('selectTranslate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should return an observable with the translation value', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('home').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('home english');
  }));

  it('should support lang changes', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('home').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('home english');
    service.setActiveLang('es');
    runLoader();
    expect(spy).toHaveBeenCalledWith('home spanish');
  }));

  it('should return an observable with the translation value with param', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('alert', { value: 'val' }).subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('alert val english');
  }));

  it('should support different lang', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('alert', { value: 'val' }, 'es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('alert val spanish');
    // it should not change the lang when static
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it('should support scope', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy english');
  }));

  it('should support scope with lang', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page/es').subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish');
  }));

  it('should listen to lang change when passing just the scope', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page').subscribe(spy);
    runLoader();
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(2);
  }));

  it('should not listen to lang change when passing scope with lang', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service.selectTranslate('title', {}, 'lazy-page/es').subscribe(spy);
    runLoader();
    service.setActiveLang('en');
    runLoader();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish');
  }));

  it('should support scope with param', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate('withParam', { param: 'Transloco' }, 'lazy-page')
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
  }));

  it('should support scope with lang and params', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate('withParam', { param: 'Transloco' }, 'lazy-page/es')
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Admin Lazy spanish Transloco');
  }));

  it('should support nested scope with params', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate(
        'params',
        { value: 'Transloco' },
        'transpilers/messageformat'
      )
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Replaces standard Transloco - english');
  }));

  it('should support nested scope with lang and params', fakeAsync(() => {
    const spy = jasmine.createSpy();
    service
      .selectTranslate(
        'params',
        { value: 'Transloco' },
        'transpilers/messageformat/es'
      )
      .subscribe(spy);
    runLoader();
    expect(spy).toHaveBeenCalledWith('Replaces standard Transloco - spanish');
  }));

  describe('inline loader', () => {
    it('select translate with inline loader', fakeAsync(() => {
      const spy = jasmine.createSpy();
      service.selectTranslate('title', {}, inlineScope).subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('Todos Title English');
    }));
    it('should support scope with lang and params', fakeAsync(() => {
      const spy = jasmine.createSpy();
      service
        .selectTranslate(
          'withParam',
          { param: 'Transloco' },
          { scope: 'lazy-page' }
        )
        .subscribe(spy);
      runLoader();
      expect(spy).toHaveBeenCalledWith('Admin Lazy english Transloco');
    }));
  });
});
