import { TranslocoPipe, TranslocoScope, TranslocoService } from '@ngneat/transloco';
import { Mock } from 'ts-mocks';
import { ChangeDetectorRef } from '@angular/core';
import { createService, runLoader } from '../transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { of } from 'rxjs';

describe('TranslocoPipe', () => {
  let translateServiceMock;
  let cdrMock;
  let pipe;

  beforeEach(() => {
    translateServiceMock = new Mock<TranslocoService>(createService()).Object;

    cdrMock = new Mock<ChangeDetectorRef>({
      markForCheck: () => {}
    }).Object;

    pipe = new TranslocoPipe(translateServiceMock, null, null, cdrMock);
    spyOn(pipe as any, 'updateValue').and.callThrough();
  });

  it('should return empty string as default', () => {
    pipe = new TranslocoPipe(translateServiceMock, null, 'es', cdrMock);
    expect(pipe.transform('title', {})).toBe('');
  });

  it('should use provided language', fakeAsync(() => {
    spyOn(translateServiceMock, 'translate').and.callThrough();
    pipe = new TranslocoPipe(translateServiceMock, null, 'es', cdrMock);
    pipe.transform('title', {});
    runLoader();
    expect(translateServiceMock.translate).toHaveBeenCalledWith('title', {}, 'es');
  }));

  describe('Scoped Translation', () => {
    function assertScopedTranslation(scope: TranslocoScope) {
      spyOn(translateServiceMock, 'translate').and.callThrough();
      pipe = new TranslocoPipe(translateServiceMock, scope, null, cdrMock);
      translateServiceMock.config.reRenderOnLangChange = true;
      pipe.transform('title', {});
      runLoader();
      expect(translateServiceMock.translate).toHaveBeenCalledWith('title', {}, 'en');
      translateServiceMock.setActiveLang('es');
      runLoader();
      expect(translateServiceMock.translate).toHaveBeenCalledWith('title', {}, 'es');
    }

    it('should load scoped translation', fakeAsync(() => {
      assertScopedTranslation('lazy-page');
    }));

    it('should load scoped translation with scope alias', fakeAsync(() => {
      assertScopedTranslation({ scope: 'lazy-scope-alias', alias: 'myScopeAlias' });
    }));
  });

  it('should load scope translation with multiple provided scopes', fakeAsync(() => {
    spyOn(translateServiceMock, 'translate').and.callThrough();
    pipe = new TranslocoPipe(
      translateServiceMock,
      [{ scope: 'lazy-page', alias: 'lazyPageAlias' }, { scope: 'admin-page', alias: 'adminPageAlias' }],
      null,
      cdrMock
    );
    (pipe as any).listenToLangChange = true;
    pipe.transform('lazyPageAlias.title', {});
    runLoader();
    expect(translateServiceMock.translate).toHaveBeenCalledWith('lazyPageAlias.title', {}, 'en');

    pipe.transform('adminPageAlias.title', {});
    runLoader();
    expect(translateServiceMock.translate).toHaveBeenCalledWith('adminPageAlias.title', {}, 'en');

    translateServiceMock.setActiveLang('es');
    pipe.transform('lazyPageAlias.title', {});
    runLoader();
    expect(translateServiceMock.translate).toHaveBeenCalledWith('lazyPageAlias.title', {}, 'es');

    pipe.transform('adminPageAlias.title', {});
    runLoader();
    expect(translateServiceMock.translate).toHaveBeenCalledWith('adminPageAlias.title', {}, 'es');
  }));

  describe('updateValue', () => {
    it('should update the value, set the cache and mark for check', fakeAsync(() => {
      const key = 'home';
      pipe.transform(key);
      expect(pipe.lastKey).toBe(key);
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledWith(key, undefined);
      expect(pipe.lastValue).toBe('home english');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));

    it('should set the value to the key if no translation exists', fakeAsync(() => {
      const key = 'kazaz';
      pipe.transform(key);
      runLoader();
      expect(pipe.lastValue).toBe(key);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));
  });

  describe('transform', () => {
    it('should unsubscribe after one emit when not in reRenderOnLangChange mode', fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect(pipe.subscription.closed).toBe(true);
    }));

    it('should return the key when the key is falsy', () => {
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform(null)).toBe(null);
      expect(pipe.transform(undefined)).toBe(undefined);
    });

    it('should perform translate', fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect(pipe.lastValue).toBe('home english');
    }));

    it('should perform translate with params', fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect(pipe.lastValue).toBe('alert value english');
    }));

    it('should return the value from the cache', fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('home');
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('a.b.c');
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(2);
    }));

    it('should return the value from the cache with params', fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('alert', { value: 'value' });
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('alert', { value: 'bla' });
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(2);
    }));
  });

  it('should unsubscribe on destroy', () => {
    pipe.subscription = of().subscribe();
    const spy = spyOn(pipe.subscription, 'unsubscribe');
    pipe.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    expect(pipe.subscription).toEqual(null);
  });
});
