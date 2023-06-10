import { Provider, Type } from '@angular/core';

import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoScope } from './types';

import {
  DefaultTranspiler,
  TRANSLOCO_TRANSPILER,
} from './transloco.transpiler';
import {
  DefaultHandler,
  TRANSLOCO_MISSING_HANDLER,
} from './transloco-missing-handler';
import {
  DefaultInterceptor,
  TRANSLOCO_INTERCEPTOR,
} from './transloco.interceptor';
import {
  DefaultFallbackStrategy,
  TRANSLOCO_FALLBACK_STRATEGY,
} from './transloco-fallback-strategy';

export const defaultProviders = [
  {
    provide: TRANSLOCO_TRANSPILER,
    useClass: DefaultTranspiler,
    deps: [TRANSLOCO_CONFIG],
  },
  {
    provide: TRANSLOCO_MISSING_HANDLER,
    useClass: DefaultHandler,
  },
  {
    provide: TRANSLOCO_INTERCEPTOR,
    useClass: DefaultInterceptor,
  },
  {
    provide: TRANSLOCO_FALLBACK_STRATEGY,
    useClass: DefaultFallbackStrategy,
    deps: [TRANSLOCO_CONFIG],
  },
];

type TranslocoOptions = {
  config?: TranslocoConfig;
  loader?: Type<TranslocoLoader>;
};

export function provideTransloco(options: TranslocoOptions) {
  const providers: Provider[] = [...defaultProviders];

  if (options.config) {
    providers.push(...provideTranslocoConfig(options.config));
  }

  if (options.loader) {
    providers.push(...provideTranslocoLoader(options.loader));
  }

  return providers;
}

export function provideTranslocoConfig(config: TranslocoConfig) {
  return [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: config,
    },
  ];
}

export function provideTranslocoLoader(loader: Type<TranslocoLoader>) {
  return [{ provide: TRANSLOCO_LOADER, useClass: loader }];
}

export function provideTranslocoScope(scope: TranslocoScope) {
  return [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: scope,
    },
  ];
}
