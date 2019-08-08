import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { TranslocoLoaderComponent } from './loader-component.component';
import { TranslocoDirective } from './transloco.directive';
import { TranslocoParamsPipe } from './transloco-params.pipe';
import { TranslocoPipe } from './transloco.pipe';
import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { HashMap, Translation } from './types';
import { Observable, of } from 'rxjs';
import { defaultProviders } from './transloco.module';

export class TestingLoader implements TranslocoLoader {
  constructor(@Inject('translocoLangs') private langs: HashMap<Translation>) {
  }

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return of(this.langs[lang]);
  }
}

@NgModule({
  declarations: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe, TranslocoLoaderComponent],
  exports: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe],
  entryComponents: [TranslocoLoaderComponent]
})
export class TranslocoTestingModule {
  static withLangs(langs: HashMap<Translation>): ModuleWithProviders {
    return {
      ngModule: TranslocoTestingModule,
      providers: [
        {
          provide: 'translocoLangs',
          useValue: langs,
        },
        {
          provide: TRANSLOCO_LOADER,
          useClass: TestingLoader
        },
        defaultProviders
      ],
    };
  }
}
