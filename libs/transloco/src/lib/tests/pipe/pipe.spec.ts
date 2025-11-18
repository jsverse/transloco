import { Mock } from 'ts-mocks';
import { ChangeDetectorRef } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { createService, runLoader } from '../mocks';
import { TranslocoService } from '../../transloco.service';
import { TranslocoPipe } from '../../transloco.pipe';
import { TranslocoScope } from '../../transloco.types';

describe('TranslocoPipe', () => {
  let serviceMock: TranslocoService;
  let cdrMock: ChangeDetectorRef;
  let pipe: TranslocoPipe;

  beforeEach(() => {
    serviceMock = new Mock<TranslocoService>(createService()).Object;

    cdrMock = new Mock<ChangeDetectorRef>({
      markForCheck: () => {},
    }).Object;

    pipe = new TranslocoPipe(serviceMock, undefined, undefined, cdrMock);
    spyOn(pipe as any, 'updateValue').and.callThrough();
  });

  it(`GIVEN pipe with provider lang
      WHEN transform is called before translations load
      THEN should return empty string as default`, () => {
    pipe = new TranslocoPipe(serviceMock, undefined, 'es', cdrMock);
    expect(pipe.transform('title', {})).toBe('');
  });

  it(`GIVEN pipe with provided language
      WHEN transform is called
      THEN should use provided language for translation`, fakeAsync(() => {
    spyOn(serviceMock, 'translate').and.callThrough();
    pipe = new TranslocoPipe(serviceMock, undefined, 'es', cdrMock);
    pipe.transform('title', {});
    runLoader();
    expect(serviceMock.translate).toHaveBeenCalledWith('title', {}, 'es');
  }));

  describe('Scoped Translation', () => {
    function assertScopedTranslation(scope: TranslocoScope) {
      spyOn(serviceMock, 'translate').and.callThrough();
      pipe = new TranslocoPipe(serviceMock, scope, undefined, cdrMock);
      serviceMock.config.reRenderOnLangChange = true;
      pipe.transform('title', {});
      runLoader();
      expect(serviceMock.translate).toHaveBeenCalledWith('title', {}, 'en');
      serviceMock.setActiveLang('es');
      runLoader();
      expect(serviceMock.translate).toHaveBeenCalledWith('title', {}, 'es');
    }

    it(`GIVEN pipe with scope
        WHEN language changes
        THEN should load scoped translation`, fakeAsync(() => {
      assertScopedTranslation('lazy-page');
    }));

    it(`GIVEN pipe with scope alias
        WHEN language changes
        THEN should load scoped translation using alias`, fakeAsync(() => {
      assertScopedTranslation({
        scope: 'lazy-scope-alias',
        alias: 'myScopeAlias',
      });
    }));
  });

  it(`GIVEN pipe with multiple provided scopes
      WHEN translating keys from different scopes
      THEN should load scope translations correctly`, fakeAsync(() => {
    spyOn(serviceMock, 'translate').and.callThrough();
    pipe = new TranslocoPipe(
      serviceMock,
      [
        { scope: 'lazy-page', alias: 'lazyPageAlias' },
        { scope: 'admin-page', alias: 'adminPageAlias' },
      ],
      undefined,
      cdrMock,
    );
    (pipe as any).listenToLangChange = true;
    pipe.transform('lazyPageAlias.title', {});
    runLoader();
    expect(serviceMock.translate).toHaveBeenCalledWith(
      'lazyPageAlias.title',
      {},
      'en',
    );

    pipe.transform('adminPageAlias.title', {});
    runLoader();
    expect(serviceMock.translate).toHaveBeenCalledWith(
      'adminPageAlias.title',
      {},
      'en',
    );

    serviceMock.setActiveLang('es');
    pipe.transform('lazyPageAlias.title', {});
    runLoader();
    expect(serviceMock.translate).toHaveBeenCalledWith(
      'lazyPageAlias.title',
      {},
      'es',
    );

    pipe.transform('adminPageAlias.title', {});
    runLoader();
    expect(serviceMock.translate).toHaveBeenCalledWith(
      'adminPageAlias.title',
      {},
      'es',
    );
  }));

  describe('updateValue', () => {
    it(`GIVEN pipe transform is called
        WHEN translation is loaded
        THEN should update value, cache it and mark for check`, fakeAsync(() => {
      const key = 'home';
      pipe.transform(key);
      expect((pipe as any).lastKey).toBe(key);
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledWith(key, undefined);
      expect((pipe as any).lastValue).toBe('home english');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));

    it(`GIVEN pipe transform with non-existent key
        WHEN translation is loaded
        THEN should set value to key itself`, fakeAsync(() => {
      const key = 'kazaz';
      pipe.transform(key);
      runLoader();
      expect((pipe as any).lastValue).toBe(key);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));
  });

  describe('transform', () => {
    it(`GIVEN pipe without reRenderOnLangChange mode
        WHEN translation emits
        THEN should unsubscribe after one emit`, fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect((pipe as any).subscription.closed).toBe(true);
    }));

    it(`GIVEN pipe transform with falsy key
        WHEN transform is called
        THEN should return the key as-is`, () => {
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform(null)).toBeNull();
      expect(pipe.transform(undefined as any)).toBeUndefined();
    });

    it(`GIVEN pipe transform with valid key
        WHEN translation is loaded
        THEN should perform translation`, fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect((pipe as any).lastValue).toBe('home english');
    }));

    it(`GIVEN pipe transform with params
        WHEN translation is loaded
        THEN should perform translation with interpolated params`, fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect((pipe as any).lastValue).toBe('alert value english');
    }));

    it(`GIVEN pipe transform called with same key
        WHEN transform is called multiple times
        THEN should return cached value`, fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('home');
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('a.b.c');
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(2);
    }));

    it(`GIVEN pipe transform called with same key and params
        WHEN transform is called multiple times
        THEN should return cached value until params change`, fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('alert', { value: 'value' });
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(1);
      pipe.transform('alert', { value: 'bla' });
      expect((pipe as any).updateValue).toHaveBeenCalledTimes(2);
    }));
  });

  it(`GIVEN pipe with active subscription
      WHEN pipe is destroyed
      THEN should unsubscribe from observable`, () => {
    (pipe as any).subscription = of().subscribe();
    const spy = spyOn((pipe as any).subscription, 'unsubscribe');
    pipe.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    expect((pipe as any).subscription).toEqual(null);
  });
});
