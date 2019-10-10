export { translate, TranslocoService } from './lib/transloco.service';
export { TranslocoDirective } from './lib/transloco.directive';
export { TranslocoPipe } from './lib/transloco.pipe';
export { TranslocoModule, defaultProviders } from './lib/transloco.module';
export { TRANSLOCO_LOADER, TranslocoLoader } from './lib/transloco.loader';
export { TranslocoConfig, TRANSLOCO_CONFIG, defaultConfig } from './lib/transloco.config';
export { TRANSLOCO_TRANSPILER, DefaultTranspiler, TranslocoTranspiler } from './lib/transloco.transpiler';
export { Translation, FailedEvent, HashMap, LoadedEvent, TranslocoEvents } from './lib/types';
export { TRANSLOCO_SCOPE } from './lib/transloco-scope';
export { TRANSLOCO_LOADING_TEMPLATE } from './lib/transloco-loading-template';
export { TRANSLOCO_LANG } from './lib/transloco-lang';
export { TestingLoader, TranslocoTestingModule } from './lib/transloco-testing.module';
export { TemplateHandler, View } from './lib/template-handler';
export { TRANSLOCO_INTERCEPTOR, TranslocoInterceptor } from './lib/transloco.interceptor';
export {
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoFallbackStrategy,
  DefaultFallbackStrategy
} from './lib/transloco-fallback-strategy';
export { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './lib/transloco-missing-handler';
export { getBrowserCultureLang, getBrowserLang } from './lib/browser-lang';
export * from './lib/types';
export * from './lib/helpers';
export { ProviderScope } from './lib/types';
export { getPipeValue } from './lib/shared';
export { getLangFromScope } from './lib/shared';
export { getScopeFromLang } from './lib/shared';
