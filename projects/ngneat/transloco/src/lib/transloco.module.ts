import { NgModule } from '@angular/core';
import { TranslocoLoaderComponent } from './loader-component.component';
import { TranslocoDirective } from './transloco.directive';
import { DefaultTranspiler, TRANSLOCO_TRANSPILER } from './transloco.transpiler';
import { TranslocoParamsPipe } from './transloco-params.pipe';
import { TranslocoPipe } from './transloco.pipe';
import { DefaultHandler, TRANSLOCO_MISSING_HANDLER } from './transloco-missing-handler';
import { DefaultInterceptor, TRANSLOCO_INTERCEPTOR } from './transloco.interceptor';
import { DefaultFallbackStrategy, TRANSLOCO_FALLBACK_STRATEGY } from './transloco-fallback-strategy';
import { TRANSLOCO_CONFIG } from './transloco.config';

export const defaultProviders = [{
  provide: TRANSLOCO_TRANSPILER,
  useClass: DefaultTranspiler
},
  {
    provide: TRANSLOCO_MISSING_HANDLER,
    useClass: DefaultHandler
  },
  {
    provide: TRANSLOCO_INTERCEPTOR,
    useClass: DefaultInterceptor
  },
  {
    provide: TRANSLOCO_FALLBACK_STRATEGY,
    useClass: DefaultFallbackStrategy,
    deps: [TRANSLOCO_CONFIG]
  }]

@NgModule({
  declarations: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe, TranslocoLoaderComponent],
  providers: [defaultProviders],
  exports: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe],
  entryComponents: [TranslocoLoaderComponent]
})
export class TranslocoModule {
}
