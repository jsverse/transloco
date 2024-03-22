import {map, timer} from 'rxjs';
import {TestBed, tick} from '@angular/core/testing';
import {TranslocoLoader} from '../transloco.loader';
import {PartialTranslocoConfig, translocoConfig,} from '../transloco.config';
import {TranslocoService} from '../transloco.service';
import {TRANSLOCO_LOADING_TEMPLATE} from '../transloco-loading-template';
import {TranslocoFallbackStrategy,} from '../transloco-fallback-strategy';
import {ProviderScope, Translation} from '../types';

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
import {provideTransloco, provideTranslocoFallbackStrategy} from "../transloco.providers";
import {Type} from "@angular/core";

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

export class MockedLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return timer(1000).pipe(map(() => mockLangs[lang]));
  }
}

export const providersMock = provideTransloco({
  config: translocoConfig({ availableLangs: ['en', 'es'] }),
  loader: MockedLoader
});

export function runLoader(times = 1) {
  tick(times * 1001);
}

export function setlistenToLangChange(
  service: TranslocoService,
  reRenderOnLangChange = true
) {
  service.config.reRenderOnLangChange = reRenderOnLangChange;
}

export const loadingTemplateMock = {
  provide: TRANSLOCO_LOADING_TEMPLATE,
  useValue: 'loading template...',
};

interface Providers {
  loader?: Type<TranslocoLoader>;
  fallback?: Type<TranslocoFallbackStrategy>;
}
export function createService(
  config: PartialTranslocoConfig = {},
  overrides: Providers = {}
) {
  const mergedConfig = translocoConfig({
    defaultLang: 'en',
    availableLangs: ['en', 'es'],
    fallbackLang: 'en',
    ...config,
  });

  const providers: any[] = [
    provideTransloco({
      config: mergedConfig,
      loader: overrides.loader === undefined ? MockedLoader : overrides.loader,
    })
  ];
  
  if (overrides.fallback) {
    providers.push(provideTranslocoFallbackStrategy(overrides.fallback));
  }
  
  return TestBed.configureTestingModule({
    providers,
  }).inject(TranslocoService);
}

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
