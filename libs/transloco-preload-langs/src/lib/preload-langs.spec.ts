import { createServiceFactory, mockProvider } from '@ngneat/spectator/vitest';
import { PLATFORM_ID } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import {
  TRANSLOCO_PRELOAD_LANGUAGES,
  TranslocoPreloadLangsService,
} from './preload-langs.service';
import './preload-langs.providers';

describe('TranslocoPreloadLangsService', () => {
  const load = vi.fn(() => of({}));

  // Registered before the factory so it runs after spectator's teardown (hooks
  // run in reverse), which destroys the service and calls the stubbed globals.
  afterEach(() => {
    delete (globalThis as { ngServerMode?: boolean }).ngServerMode;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const serviceFactory = createServiceFactory({
    service: TranslocoPreloadLangsService,
    providers: [
      mockProvider(TranslocoService, {
        load,
        _completeScopeWithLang: (langOrScope: string) => langOrScope,
      }),
      { provide: TRANSLOCO_PRELOAD_LANGUAGES, useValue: ['es', 'admin-page'] },
    ],
  });

  beforeEach(() => {
    load.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it(`GIVEN the package modules are imported
      WHEN the environment lacks requestIdleCallback
      THEN window is not patched with a polyfill`, () => {
    expect(window.requestIdleCallback).toBeUndefined();
    expect(window.cancelIdleCallback).toBeUndefined();
  });

  describe('when requestIdleCallback is available', () => {
    let idleCallback: (() => void) | undefined;
    const requestIdleCallback = vi.fn((cb: () => void) => {
      idleCallback = cb;
      return 42;
    });
    const cancelIdleCallback = vi.fn();

    beforeEach(() => {
      idleCallback = undefined;
      requestIdleCallback.mockClear();
      cancelIdleCallback.mockClear();
      vi.stubGlobal('requestIdleCallback', requestIdleCallback);
      vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);
    });

    it(`GIVEN languages to preload
        WHEN the service is constructed
        THEN loading is deferred until the browser is idle`, () => {
      serviceFactory();

      expect(requestIdleCallback).toHaveBeenCalledTimes(1);
      expect(load).not.toHaveBeenCalled();

      idleCallback?.();

      expect(load).toHaveBeenCalledWith('es');
      expect(load).toHaveBeenCalledWith('admin-page');
    });

    it(`GIVEN a scheduled preload
        WHEN the service is destroyed before the browser is idle
        THEN the idle callback is cancelled`, () => {
      const spectator = serviceFactory();

      spectator.service.ngOnDestroy();

      expect(cancelIdleCallback).toHaveBeenCalledWith(42);
    });

    it(`GIVEN no languages to preload
        WHEN the service is constructed
        THEN nothing is scheduled`, () => {
      serviceFactory({
        providers: [{ provide: TRANSLOCO_PRELOAD_LANGUAGES, useValue: [] }],
      });

      expect(requestIdleCallback).not.toHaveBeenCalled();
    });
  });

  describe('when requestIdleCallback is unavailable (Safari)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it(`GIVEN languages to preload
        WHEN the service is constructed
        THEN loading falls back to a timeout`, () => {
      serviceFactory();

      expect(load).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(load).toHaveBeenCalledTimes(2);
    });

    it(`GIVEN a scheduled preload
        WHEN the service is destroyed before the timeout fires
        THEN nothing is loaded`, () => {
      const spectator = serviceFactory();

      spectator.service.ngOnDestroy();
      vi.runAllTimers();

      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('on the server', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it(`GIVEN ngServerMode is true
        WHEN the service is constructed
        THEN nothing is scheduled or loaded`, () => {
      (globalThis as { ngServerMode?: boolean }).ngServerMode = true;

      serviceFactory();

      expect(vi.getTimerCount()).toBe(0);
      vi.runAllTimers();
      expect(load).not.toHaveBeenCalled();
    });

    it(`GIVEN PLATFORM_ID is 'server' and ngServerMode is unset
        WHEN the service is constructed
        THEN nothing is scheduled or loaded`, () => {
      serviceFactory({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });

      expect(vi.getTimerCount()).toBe(0);
      vi.runAllTimers();
      expect(load).not.toHaveBeenCalled();
    });
  });
});
