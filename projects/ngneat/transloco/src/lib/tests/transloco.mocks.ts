import { DefaultTranspiler, TRANSLOCO_TRANSPILER } from '../transloco.transpiler';
import { TRANSLOCO_LOADER } from '../transloco.loader';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from '../transloco.config';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { DefaultHandler, TRANSLOCO_MISSING_HANDLER } from '../transloco-missing-handler';
import en from '../../../../../../src/assets/i18n/en.json';
import es from '../../../../../../src/assets/i18n/es.json';
import enLazy from '../../../../../../src/assets/i18n/lazy-page/en.json';
import esLazy from '../../../../../../src/assets/i18n/lazy-page/es.json';
import enLazyScopeAlias from '../../../../../../src/assets/i18n/lazy-scope-alias/en.json';
import esLazyScopeAlias from '../../../../../../src/assets/i18n/lazy-scope-alias/es.json';
import enMF from '../../../../../../src/assets/i18n/transpilers/messageformat/en.json';
import esMF from '../../../../../../src/assets/i18n/transpilers/messageformat/es.json';
import { tick } from '@angular/core/testing';
import { TranslocoService } from '../transloco.service';
import { TRANSLOCO_LOADING_TEMPLATE } from '../transloco-loading-template';
import { DefaultInterceptor, TRANSLOCO_INTERCEPTOR } from '../transloco.interceptor';
import { DefaultFallbackStrategy, TRANSLOCO_FALLBACK_STRATEGY } from '../transloco-fallback-strategy';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

export const mockLangs = {
  en,
  es,
  'lazy-page/en': enLazy,
  'lazy-page/es': esLazy,
  'lazy-scope-alias/en': enLazyScopeAlias,
  'lazy-scope-alias/es': esLazyScopeAlias,
  'transpilers/messageformat/en': enMF,
  'transpilers/messageformat/es': esMF
};

export const loader = {
  getTranslation(lang: string) {
    return timer(1000).pipe(map(() => mockLangs[lang])) as any;
  }
};

export const configProviderMock = (config = {}) => ({
  provide: TRANSLOCO_CONFIG,
  useValue: { ...defaultConfig, ...config, availableLangs: ['en', 'es'] } as TranslocoConfig
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

export const fallbackStrategyProviderMock = {
  provide: TRANSLOCO_FALLBACK_STRATEGY,
  useClass: DefaultFallbackStrategy,
  deps: [TRANSLOCO_CONFIG]
};

export const providersMock = [
  configProviderMock(),
  interceptorProviderMock,
  loaderProviderMock,
  transpilerProviderMock,
  missingHandlerProviderMock,
  fallbackStrategyProviderMock
];

export function runLoader(times = 1) {
  tick(times * 1001);
}

export function setlistenToLangChange(service: TranslocoService, reRenderOnLangChange = true) {
  (service as any).mergedConfig.reRenderOnLangChange = reRenderOnLangChange;
}

export const loadingTemplateMock = { provide: TRANSLOCO_LOADING_TEMPLATE, useValue: 'loading template...' };

export function createService(config: Partial<TranslocoConfig> = {}) {
  return new TranslocoService(
    loader,
    new DefaultTranspiler(),
    new DefaultHandler(),
    new DefaultInterceptor(),
    { defaultLang: 'en', ...config, availableLangs: ['en', 'es'] },
    new DefaultFallbackStrategy({ defaultLang: 'en', fallbackLang: 'en' })
  );
}

export const scopeAliasMock = {
  provide: TRANSLOCO_SCOPE,
  useValue: { scope: 'lazy-scope-alias', alias: 'myScopeAlias' }
};
