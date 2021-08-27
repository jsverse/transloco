import {
  DefaultTranspiler,
  TRANSLOCO_TRANSPILER,
} from '../transloco.transpiler';
import { TRANSLOCO_LOADER } from '../transloco.loader';
import {
  TRANSLOCO_CONFIG,
  TranslocoConfig,
  translocoConfig,
} from '../transloco.config';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DefaultHandler,
  TRANSLOCO_MISSING_HANDLER,
} from '../transloco-missing-handler';
import en from './i18n-mocks/en.json';
import es from './i18n-mocks/es.json';
import enLazy from './i18n-mocks/lazy-page/en.json';
import esLazy from './i18n-mocks/lazy-page/es.json';
import enAdmin from './i18n-mocks/admin-page/en.json';
import esAdmin from './i18n-mocks/admin-page/es.json';
import enLazyScopeAlias from './i18n-mocks/lazy-scope-alias/en.json';
import esLazyScopeAlias from './i18n-mocks/lazy-scope-alias/es.json';
import enMF from './i18n-mocks/transpilers/messageformat/en.json';
import esMF from './i18n-mocks/transpilers/messageformat/es.json';
import { tick } from '@angular/core/testing';
import { TranslocoService } from '../transloco.service';
import { TRANSLOCO_LOADING_TEMPLATE } from '../transloco-loading-template';
import {
  DefaultInterceptor,
  TRANSLOCO_INTERCEPTOR,
} from '../transloco.interceptor';
import {
  DefaultFallbackStrategy,
  TRANSLOCO_FALLBACK_STRATEGY,
} from '../transloco-fallback-strategy';
import { ProviderScope, Translation } from '../types';
import { TRANSLOCO_SCOPE } from '../transloco-scope';

export const mockLangs: Record<string, Translation> = {
  en,
  es,
  'lazy-page/en': enLazy,
  'lazy-page/es': esLazy,
  'admin-page/en': enAdmin,
  'admin-page/es': esAdmin,
  'lazy-scope-alias/en': enLazyScopeAlias,
  'lazy-scope-alias/es': esLazyScopeAlias,
  'transpilers/messageformat/en': enMF,
  'transpilers/messageformat/es': esMF,
};

export const loader = {
  getTranslation(lang: string) {
    return timer(1000).pipe(map(() => mockLangs[lang]));
  },
};

export const configProviderMock = (config = {}) => ({
  provide: TRANSLOCO_CONFIG,
  useValue: translocoConfig({ ...config, availableLangs: ['en', 'es'] }),
});

export const loaderProviderMock = {
  provide: TRANSLOCO_LOADER,
  useValue: loader,
};

export const transpilerProviderMock = {
  provide: TRANSLOCO_TRANSPILER,
  useClass: DefaultTranspiler,
};

export const interceptorProviderMock = {
  provide: TRANSLOCO_INTERCEPTOR,
  useClass: DefaultInterceptor,
};

export const missingHandlerProviderMock = {
  provide: TRANSLOCO_MISSING_HANDLER,
  useClass: DefaultHandler,
};

export const fallbackStrategyProviderMock = {
  provide: TRANSLOCO_FALLBACK_STRATEGY,
  useClass: DefaultFallbackStrategy,
  deps: [TRANSLOCO_CONFIG],
};

export const providersMock = [
  configProviderMock(),
  interceptorProviderMock,
  loaderProviderMock,
  transpilerProviderMock,
  missingHandlerProviderMock,
  fallbackStrategyProviderMock,
];

export function runLoader(times = 1) {
  tick(times * 1001);
}

export function setlistenToLangChange(
  service: TranslocoService,
  reRenderOnLangChange = true
) {
  (service as any).mergedConfig.reRenderOnLangChange = reRenderOnLangChange;
}

export const loadingTemplateMock = {
  provide: TRANSLOCO_LOADING_TEMPLATE,
  useValue: 'loading template...',
};

export function createService(config: Partial<TranslocoConfig> = {}) {
  return new TranslocoService(
    loader,
    new DefaultTranspiler(),
    new DefaultHandler(),
    new DefaultInterceptor(),
    { defaultLang: 'en', availableLangs: ['en', 'es'], ...config },
    new DefaultFallbackStrategy({ defaultLang: 'en', fallbackLang: 'en' })
  );
}

export const scopeAliasMock = {
  provide: TRANSLOCO_SCOPE,
  useValue: { scope: 'lazy-scope-alias', alias: 'myScopeAlias' },
};

export const inlineScope: ProviderScope = {
  scope: 'todos',
  loader: {
    en: () =>
      Promise.resolve({
        default: { title: 'Todos Title English' },
      }),
    es: () =>
      Promise.resolve({
        default: { title: 'Todos Title Spanish' },
      }),
  },
};

export const transpilerFunctions = {
  upperCase: { transpile: (v: string) => v.toUpperCase() },
  testParams: { transpile: (v: string) => `Hello {{person}} ${v}` },
  testKeyReference: { transpile: () => `{{fromList}}` },
  returnSecondParam: { transpile: (_: any, v: string) => v },
};
