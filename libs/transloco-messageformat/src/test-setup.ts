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
