import {
  APP_INITIALIZER,
  Inject,
  Injectable,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
} from '@angular/core';
import { Observable, of } from 'rxjs';

import { TranslocoLoader } from './transloco.loader';
import { Translation } from './transloco.types';
import { TranslocoModule } from './transloco.module';
import { provideTransloco } from './transloco.providers';
import { TranslocoConfig } from './transloco.config';
import { TranslocoService } from './transloco.service';
import { HashMap } from './utils/type.utils';

export interface TranslocoTestingOptions {
  translocoConfig?: Partial<TranslocoConfig>;
  preloadLangs?: boolean;
  langs?: HashMap<Translation>;
}

const TRANSLOCO_TEST_LANGS = /* @__PURE__ */ new InjectionToken<
  HashMap<Translation>
>('TRANSLOCO_TEST_LANGS - Available testing languages');
const TRANSLOCO_TEST_OPTIONS =
  /* @__PURE__ */ new InjectionToken<TranslocoTestingOptions>(
    'TRANSLOCO_TEST_OPTIONS - Testing options',
  );

@Injectable()
export class TestingLoader implements TranslocoLoader {
  constructor(
    @Inject(TRANSLOCO_TEST_LANGS) private langs: HashMap<Translation>,
  ) {}

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return of(this.langs[lang]);
  }
}

export function initTranslocoService(
  service: TranslocoService,
  langs: HashMap<Translation> = {},
  options: TranslocoTestingOptions,
) {
  const preloadAllLangs = () =>
    options.preloadLangs
      ? Promise.all(
          Object.keys(langs).map((lang) => service.load(lang).toPromise()),
        )
      : Promise.resolve();

  return preloadAllLangs;
}

@NgModule({
  exports: [TranslocoModule],
})
export class TranslocoTestingModule {
  static forRoot(
    options: TranslocoTestingOptions,
  ): ModuleWithProviders<TranslocoTestingModule> {
    return {
      ngModule: TranslocoTestingModule,
      providers: [
        provideTransloco({
          loader: TestingLoader,
          config: {
            prodMode: true,
            missingHandler: { logMissingKey: false },
            ...options.translocoConfig,
          },
        }),
        {
          provide: TRANSLOCO_TEST_LANGS,
          useValue: options.langs,
        },
        {
          provide: TRANSLOCO_TEST_OPTIONS,
          useValue: options,
        },
        {
          provide: APP_INITIALIZER,
          useFactory: initTranslocoService,
          deps: [
            TranslocoService,
            TRANSLOCO_TEST_LANGS,
            TRANSLOCO_TEST_OPTIONS,
          ],
          multi: true,
        },
      ],
    };
  }
}
