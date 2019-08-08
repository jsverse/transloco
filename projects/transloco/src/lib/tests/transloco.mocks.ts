import { DefaultTranspiler, TRANSLOCO_TRANSPILER } from '../transloco.transpiler';
import { TRANSLOCO_LOADER } from '../transloco.loader';
import { defaultConfig, TRANSLOCO_CONFIG } from '../transloco.config';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { DefaultHandler, TRANSLOCO_MISSING_HANDLER } from '../transloco-missing-handler';
import en from '../../../../../src/assets/i18n/en.json';
import es from '../../../../../src/assets/i18n/es.json';
import enLazy from '../../../../../src/assets/i18n/lazy-page/en.json';
import esLazy from '../../../../../src/assets/i18n/lazy-page/es.json';
import { tick } from '@angular/core/testing';
import { TranslocoService } from '../transloco.service';
import { TRANSLOCO_LOADING_TEMPLATE } from '../transloco-loading-template';
import { DefaultInterceptor, TRANSLOCO_INTERCEPTOR } from '../transloco.interceptor';

export const mockLangs = {
  en,
  es,
  'lazy-page/en': enLazy,
  'lazy-page/es': esLazy
};

export const loader = {
  getTranslation(lang: string) {
    return timer(1000).pipe(map(() => mockLangs[lang])) as any;
  }
};

export const configProviderMock = (config = {}) => ({
  provide: TRANSLOCO_CONFIG,
  useValue: { ...defaultConfig, ...config }
});

export const loaderProviderMock = {
  provide: TRANSLOCO_LOADER,
  useValue: loader
};

export const transpilerProviderMock = {
  provide: TRANSLOCO_TRANSPILER,
  useClass: DefaultTranspiler
};

export const interceptorProviderMock = {
  provide: TRANSLOCO_INTERCEPTOR,
  useClass: DefaultInterceptor
};

export const missingHandlerProviderMock = {
  provide: TRANSLOCO_MISSING_HANDLER,
  useClass: DefaultHandler
};

export const providersMock = [configProviderMock(), interceptorProviderMock, loaderProviderMock, transpilerProviderMock, missingHandlerProviderMock];

export function runLoader(times = 1) {
  tick(times * 1001);
}

export function setRuntime(service: TranslocoService, runtime = true) {
  (service as any).mergedConfig.runtime = runtime;
}

export const loadingTemplateMock = { provide: TRANSLOCO_LOADING_TEMPLATE, useValue: 'loading template...' };

export function createService() {
  return new TranslocoService(
    loader,
    new DefaultTranspiler(),
    new DefaultHandler(),
    new DefaultInterceptor(),
    {}
  );
}
