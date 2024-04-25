import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
  Type,
} from '@angular/core';

import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import {
  PartialTranslocoConfig,
  TRANSLOCO_CONFIG,
  translocoConfig,
} from './transloco.config';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoScope } from './types';
import {
  DefaultTranspiler,
  TRANSLOCO_TRANSPILER,
  TranslocoTranspiler,
} from './transloco.transpiler';
import {
  DefaultMissingHandler,
  TRANSLOCO_MISSING_HANDLER,
  TranslocoMissingHandler,
} from './transloco-missing-handler';
import {
  DefaultInterceptor,
  TRANSLOCO_INTERCEPTOR,
  TranslocoInterceptor,
} from './transloco.interceptor';
import {
  DefaultFallbackStrategy,
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoFallbackStrategy,
} from './transloco-fallback-strategy';
import { TRANSLOCO_LOADING_TEMPLATE } from './transloco-loading-template';
import { Content } from './template-handler';
import { TRANSLOCO_LANG } from './transloco-lang';

export interface TranslocoOptions {
  config: PartialTranslocoConfig;
  loader?: Type<TranslocoLoader>;
}

export function provideTransloco(options: TranslocoOptions) {
  const providers: EnvironmentProviders[] = [
    provideTranslocoTranspiler(DefaultTranspiler),
    provideTranslocoMissingHandler(DefaultMissingHandler),
    provideTranslocoInterceptor(DefaultInterceptor),
    provideTranslocoFallbackStrategy(DefaultFallbackStrategy),
  ];

  if (options.config) {
    providers.push(provideTranslocoConfig(options.config));
  }

  if (options.loader) {
    providers.push(provideTranslocoLoader(options.loader));
  }

  return providers;
}

export function provideTranslocoConfig(config: PartialTranslocoConfig) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig(config),
    },
  ]);
}

export function provideTranslocoLoader(loader: Type<TranslocoLoader>) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_LOADER, useClass: loader },
  ]);
}

export function provideTranslocoScope(...scopes: TranslocoScope[]) {
  return scopes.map((scope) => ({
    provide: TRANSLOCO_SCOPE,
    useValue: scope,
    multi: true,
  }));
}

export function provideTranslocoLoadingTpl(content: Content) {
  return {
    provide: TRANSLOCO_LOADING_TEMPLATE,
    useValue: content,
  };
}

export function provideTranslocoTranspiler(
  transpiler: Type<TranslocoTranspiler>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_TRANSPILER,
      useClass: transpiler,
      deps: [TRANSLOCO_CONFIG],
    },
  ]);
}

export function provideTranslocoFallbackStrategy(
  strategy: Type<TranslocoFallbackStrategy>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_FALLBACK_STRATEGY,
      useClass: strategy,
      deps: [TRANSLOCO_CONFIG],
    },
  ]);
}

export function provideTranslocoMissingHandler(
  handler: Type<TranslocoMissingHandler>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: handler,
    },
  ]);
}

export function provideTranslocoInterceptor(
  interceptor: Type<TranslocoInterceptor>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_INTERCEPTOR,
      useClass: interceptor,
    },
  ]);
}

export function provideTranslocoLang(lang: string): Provider {
  return {
    provide: TRANSLOCO_LANG,
    useValue: lang,
  };
}
