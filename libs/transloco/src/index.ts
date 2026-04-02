export {
  translate,
  translateObject,
  TranslocoService,
} from './lib/transloco.service';
export { TranslocoDirective } from './lib/transloco.directive';
export { TranslocoPipe } from './lib/transloco.pipe';
export { TranslocoModule } from './lib/transloco.module';
export { TRANSLOCO_LOADER } from './lib/transloco.loader';
export type {
  TranslocoLoader,
  TranslocoLoaderData,
} from './lib/transloco.loader';
export {
  TRANSLOCO_CONFIG,
  defaultConfig,
  translocoConfig,
} from './lib/transloco.config';
export type { TranslocoConfig } from './lib/transloco.config';
export {
  TRANSLOCO_TRANSPILER,
  DefaultTranspiler,
  FunctionalTranspiler,
  getFunctionArgs,
} from './lib/transloco.transpiler';
export type {
  TranspileParams,
  TranslocoTranspiler,
  TranslocoTranspilerFunction,
} from './lib/transloco.transpiler';
export { TRANSLOCO_SCOPE } from './lib/transloco-scope';
export { TRANSLOCO_LOADING_TEMPLATE } from './lib/transloco-loading-template';
export { TRANSLOCO_LANG } from './lib/transloco-lang';
export {
  TestingLoader,
  TranslocoTestingModule,
} from './lib/transloco-testing.module';
export type { TranslocoTestingOptions } from './lib/transloco-testing.module';
export {
  TRANSLOCO_INTERCEPTOR,
  DefaultInterceptor,
} from './lib/transloco.interceptor';
export type { TranslocoInterceptor } from './lib/transloco.interceptor';
export {
  TRANSLOCO_FALLBACK_STRATEGY,
  DefaultFallbackStrategy,
} from './lib/transloco-fallback-strategy';
export type { TranslocoFallbackStrategy } from './lib/transloco-fallback-strategy';
export {
  TRANSLOCO_MISSING_HANDLER,
  DefaultMissingHandler,
} from './lib/transloco-missing-handler';
export type {
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
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
} from './lib/transloco.providers';
export type { TranslocoOptions } from './lib/transloco.providers';
export { translateSignal, translateObjectSignal } from './lib/transloco.signal';
export {
  getBrowserLang,
  getBrowserCultureLang,
  isBrowser,
} from './lib/utils/browser.utils';
export { setValue, getValue } from './lib/utils/object.utils';
export * from './lib/transloco.types';
