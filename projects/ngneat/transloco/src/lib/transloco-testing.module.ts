import { APP_INITIALIZER, Inject, Injectable, InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { HashMap, Translation } from './types';
import { Observable, of } from 'rxjs';
import { defaultProviders, TranslocoModule } from './transloco.module';
import { TRANSLOCO_CONFIG, TranslocoConfig, translocoConfig } from './transloco.config';
import { TranslocoService } from './transloco.service';

export interface TranslocoTestingOptions {
  translocoConfig?: Partial<TranslocoConfig>;
  preloadLangs?: boolean;
  langs?: HashMap<Translation>;
}

const TRANSLOCO_TEST_LANGS = new InjectionToken<HashMap<Translation>>(
  'TRANSLOCO_TEST_LANGS - Available testing languages'
);
const TRANSLOCO_TEST_OPTIONS = new InjectionToken<TranslocoTestingOptions>('TRANSLOCO_TEST_OPTIONS - Testing options');

@Injectable()
export class TestingLoader implements TranslocoLoader {
  constructor(@Inject(TRANSLOCO_TEST_LANGS) private langs: HashMap<Translation>) {}

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return of(this.langs[lang]);
  }
}

export function initTranslocoService(
  service: TranslocoService,
  langs: HashMap<Translation> = {},
  options: TranslocoTestingOptions
) {
  const preloadAllLangs = () =>
    options.preloadLangs
      ? Promise.all(Object.keys(langs).map(lang => service.load(lang).toPromise()))
      : Promise.resolve();

  return preloadAllLangs;
}

@NgModule({
  exports: [TranslocoModule]
})
export class TranslocoTestingModule {
  static forRoot(options: TranslocoTestingOptions) {
    return {
      ngModule: TranslocoTestingModule,
      providers: [
        {
          provide: TRANSLOCO_TEST_LANGS,
          useValue: options.langs
        },
        {
          provide: TRANSLOCO_TEST_OPTIONS,
          useValue: options
        },
        {
          provide: APP_INITIALIZER,
          useFactory: initTranslocoService,
          deps: [TranslocoService, TRANSLOCO_TEST_LANGS, TRANSLOCO_TEST_OPTIONS],
          multi: true
        },
        {
          provide: TRANSLOCO_LOADER,
          useClass: TestingLoader
        },
        defaultProviders,
        {
          provide: TRANSLOCO_CONFIG,
          useValue: translocoConfig({
            prodMode: true,
            missingHandler: { logMissingKey: false },
            ...options.translocoConfig
          })
        }
      ]
    };
  }

  /** @deprecated - use forRoot instead */
  static withLangs(
    langs: HashMap<Translation>,
    config: Partial<TranslocoConfig> = {},
    options: TranslocoTestingOptions = {}
  ): ModuleWithProviders<TranslocoTestingModule> {
    return {
      ngModule: TranslocoTestingModule,
      providers: [
        {
          provide: TRANSLOCO_TEST_LANGS,
          useValue: langs
        },
        {
          provide: TRANSLOCO_TEST_OPTIONS,
          useValue: options
        },
        {
          provide: APP_INITIALIZER,
          useFactory: initTranslocoService,
          deps: [TranslocoService, TRANSLOCO_TEST_LANGS, TRANSLOCO_TEST_OPTIONS],
          multi: true
        },
        {
          provide: TRANSLOCO_LOADER,
          useClass: TestingLoader
        },
        defaultProviders,
        {
          provide: TRANSLOCO_CONFIG,
          useValue: translocoConfig({
            prodMode: true,
            missingHandler: { logMissingKey: false },
            ...config
          })
        }
      ]
    };
  }
}
