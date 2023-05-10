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
export { TemplateHandler, View } from './lib/template-handler';
export {
  TRANSLOCO_INTERCEPTOR,
  TranslocoInterceptor,
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
} from './lib/transloco-missing-handler';
export { getBrowserCultureLang, getBrowserLang } from './lib/browser-lang';
export { getPipeValue, getLangFromScope, getScopeFromLang } from './lib/shared';
export * from './lib/types';
export * from './lib/helpers';
export * from './lib/transloco.providers';
