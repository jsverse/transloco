// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../@types/angular-globals/index.d.ts" />
// Loads zone.js (+ testing plugins) and patches Vitest's describe/it/beforeEach
// to run inside a ProxyZone — required for TestBed and fakeAsync/tick.
import '@analogjs/vite-plugin-angular/setup-vitest';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment. Kept explicit (rather than using
// Analog's setupTestBed, which defaults to zoneless + destroyAfterEach:true) to
// preserve the zone-based, destroyAfterEach:false behavior these suites rely on.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: false },
  },
);

// jsdom does not implement `innerText` (it's a browser-only, layout-aware
// property). The attribute form of TranslocoDirective renders via
// `renderer.setProperty(el, 'innerText', value)`, so under Karma's real browser
// the text showed up but under jsdom it silently no-ops. Alias it to
// `textContent` so the directive's DOM writes are observable in tests.
if (!('innerText' in globalThis.HTMLElement.prototype)) {
  Object.defineProperty(globalThis.HTMLElement.prototype, 'innerText', {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent;
    },
    set(this: HTMLElement, value: string) {
      this.textContent = value;
    },
  });
}
