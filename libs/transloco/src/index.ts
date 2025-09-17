export {
  translate,
  translateObject,
  TranslocoService,
} from './lib/transloco.service';
export { TranslocoDirective } from './lib/transloco.directive';
export { TranslocoPipe } from './lib/transloco.pipe';
export { TranslocoModule } from './lib/transloco.module';
export { TRANSLOCO_LOADER, TranslocoLoader } from './lib/transloco.loader';
export {
  TranslocoConfig,
  TRANSLOCO_CONFIG,
  defaultConfig,
  translocoConfig,
} from './lib/transloco.config';
export {
  TranspileParams,
  TRANSLOCO_TRANSPILER,
  DefaultTranspiler,
  TranslocoTranspiler,
  FunctionalTranspiler,
  getFunctionArgs,
  TranslocoTranspilerFunction,
} from './lib/transloco.transpiler';
export { TRANSLOCO_SCOPE } from './lib/transloco-scope';
export { TRANSLOCO_LOADING_TEMPLATE } from './lib/transloco-loading-template';
export { TRANSLOCO_LANG } from './lib/transloco-lang';
export {
  TestingLoader,
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from './lib/transloco-testing.module';
export {
  TRANSLOCO_INTERCEPTOR,
  TranslocoInterceptor,
  DefaultInterceptor,
} from './lib/transloco.interceptor';
export {
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoFallbackStrategy,
  DefaultFallbackStrategy,
} from './lib/transloco-fallback-strategy';
export {
  TRANSLOCO_MISSING_HANDLER,
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
  DefaultMissingHandler,
} from './lib/transloco-missing-handler';
export {
  provideTranslocoFallbackStrategy,
  provideTranslocoInterceptor,
  provideTranslocoTranspiler,
  provideTranslocoMissingHandler,
  provideTranslocoLoadingTpl,
  provideTransloco,
  provideTranslocoConfig,
  provideTranslocoLoader,
  provideTranslocoScope,
  provideTranslocoLang,
  TranslocoOptions,
} from './lib/transloco.providers';
export { translateSignal, translateObjectSignal } from './lib/transloco.signal';
export {
  getBrowserLang,
  getBrowserCultureLang,
  isBrowser,
} from './lib/utils/browser.utils';
export { setValue, getValue } from './lib/utils/object.utils';
export * from './lib/transloco.types';
