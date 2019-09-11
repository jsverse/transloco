import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { HashMap, Translation } from './types';
import { Observable, of } from 'rxjs';
import { defaultProviders, TranslocoModule } from './transloco.module';
import { TranslocoConfig, TRANSLOCO_CONFIG } from './transloco.config';

export class TestingLoader implements TranslocoLoader {
  constructor(@Inject('translocoLangs') private langs: HashMap<Translation>) {}

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return of(this.langs[lang]);
  }
}

@NgModule({
  exports: [TranslocoModule]
})
export class TranslocoTestingModule {
  static withLangs(langs: HashMap<Translation>, config: Partial<TranslocoConfig> = {}): ModuleWithProviders {
    return {
      ngModule: TranslocoTestingModule,
      providers: [
        {
          provide: 'translocoLangs',
          useValue: langs
        },
        {
          provide: TRANSLOCO_LOADER,
          useClass: TestingLoader
        },
        defaultProviders,
        {
          provide: TRANSLOCO_CONFIG,
          useValue: { prodMode: true, ...config }
        }
      ]
    };
  }
}
