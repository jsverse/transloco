import {Provider, Type} from '@angular/core';

import {TRANSLOCO_LOADER, TranslocoLoader} from './transloco.loader';
import {PartialTranslocoConfig, TRANSLOCO_CONFIG, translocoConfig} from './transloco.config';
import {TRANSLOCO_SCOPE} from './transloco-scope';
import {TranslocoScope} from './types';

import {DefaultTranspiler, TRANSLOCO_TRANSPILER, TranslocoTranspiler,} from './transloco.transpiler';
import {DefaultHandler, TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler,} from './transloco-missing-handler';
import {DefaultInterceptor, TRANSLOCO_INTERCEPTOR, TranslocoInterceptor,} from './transloco.interceptor';
import {
  DefaultFallbackStrategy,
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoFallbackStrategy,
} from './transloco-fallback-strategy';
import {TRANSLOCO_LOADING_TEMPLATE} from "./transloco-loading-template";
import {Content} from "./template-handler";

type TranslocoOptions = {
  config: PartialTranslocoConfig;
  loader?: Type<TranslocoLoader>;
};

export function provideTransloco(options: TranslocoOptions) {
  const providers: Provider[] = [
      provideTranslocoTranspiler(DefaultTranspiler),
      provideTranslocoMissingHandler(DefaultHandler),
      provideTranslocoInterceptor(DefaultInterceptor),
      provideTranslocoFallbackStrategy(DefaultFallbackStrategy)
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
  return{
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig(config),
    };
}

export function provideTranslocoLoader(loader: Type<TranslocoLoader>) {
  return [{ provide: TRANSLOCO_LOADER, useClass: loader }];
}

export function provideTranslocoScope(scope: TranslocoScope) {
  return {
      provide: TRANSLOCO_SCOPE,
      useValue: scope,
    }
}

export function provideTranslocoLoadingTpl(content: Content) {
  return {
    provide: TRANSLOCO_LOADING_TEMPLATE ,
    useValue: content
  }
}

export function provideTranslocoTranspiler(transpiler: Type<TranslocoTranspiler>): Provider {
  return {
    provide: TRANSLOCO_TRANSPILER,
    useClass: transpiler,
    deps: [TRANSLOCO_CONFIG],
  }
}

export function provideTranslocoFallbackStrategy(strategy: Type<TranslocoFallbackStrategy>): Provider {
  return {
    provide: TRANSLOCO_FALLBACK_STRATEGY,
    useClass: strategy,
    deps: [TRANSLOCO_CONFIG],
  }
}

export function provideTranslocoMissingHandler(handler: Type<TranslocoMissingHandler>): Provider {
  return   {
    provide: TRANSLOCO_MISSING_HANDLER,
    useClass: handler,
  }
}

export function provideTranslocoInterceptor(interceptor: Type<TranslocoInterceptor>): Provider {
  return   {
    provide: TRANSLOCO_INTERCEPTOR,
    useClass: interceptor,
  }
}
