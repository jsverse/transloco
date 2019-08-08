import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { HashMap, Translation } from './types';
import { Observable, of } from 'rxjs';
import { defaultProviders, TranslocoModule } from './transloco.module';

export class TestingLoader implements TranslocoLoader {
  constructor(@Inject('translocoLangs') private langs: HashMap<Translation>) {
  }

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return of(this.langs[lang]);
  }
}

@NgModule({
  imports: [TranslocoModule],
  exports: [TranslocoModule]
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
