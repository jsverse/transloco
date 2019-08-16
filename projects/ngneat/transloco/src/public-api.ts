export { translate, TranslocoService } from './lib/transloco.service';
export { TranslocoDirective } from './lib/transloco.directive';
export { TranslocoPipe } from './lib/transloco.pipe';
export { TranslocoModule, defaultProviders } from './lib/transloco.module';
export { TRANSLOCO_LOADER, TranslocoLoader } from './lib/transloco.loader';
export { TranslocoConfig, TRANSLOCO_CONFIG, defaultConfig } from './lib/transloco.config';
export { TRANSLOCO_TRANSPILER, DefaultTranspiler, TranslocoTranspiler } from './lib/transloco.transpiler';
export { Translation, FailedEvent, HashMap, LoadedEvent, TranslationCb, TranslocoEvents } from './lib/types';
export { TranslocoParamsPipe } from './lib/transloco-params.pipe';
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
export { MessageFormatTranspiler } from './lib/transpiler-strategies/messageformat.transpiler';
