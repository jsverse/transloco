import {
  Injectable,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { Observable, of } from 'rxjs';

import { TranslocoLoader } from './transloco.loader';
import { Translation } from './transloco.types';
import { TranslocoModule } from './transloco.module';
import { provideTransloco } from './transloco.providers';
import { PartialTranslocoConfig } from './transloco.config';
import { TranslocoService } from './transloco.service';
import { HashMap } from './utils/type.utils';

export interface TranslocoTestingOptions {
  translocoConfig?: PartialTranslocoConfig;
  preloadLangs?: boolean;
  langs?: HashMap<Translation>;
}

const TRANSLOCO_TEST_LANGS = /* @__PURE__ */ new InjectionToken<
  HashMap<Translation>
>(
  typeof ngDevMode !== 'undefined' && ngDevMode
    ? 'TRANSLOCO_TEST_LANGS - Available testing languages'
    : '',
);

const TRANSLOCO_TEST_OPTIONS =
  /* @__PURE__ */ new InjectionToken<TranslocoTestingOptions>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_TEST_OPTIONS - Testing options'
      : '',
  );

function injectTestLangs() {
  return inject(TRANSLOCO_TEST_LANGS);
}

function injectTestOptions() {
  return inject(TRANSLOCO_TEST_OPTIONS);
}

@Injectable()
export class TestingLoader implements TranslocoLoader {
  private readonly langs = injectTestLangs();

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

/**
 * Provides Transloco configured for testing: an in-memory loader serving the
 * given `langs`, `prodMode` enabled and missing-key logging disabled.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [
 *     provideTranslocoTesting({
 *       langs: { en: { hello: 'Hello' } },
 *       translocoConfig: { defaultLang: 'en' },
 *       preloadLangs: true,
 *     }),
 *   ],
 * });
 */
export function provideTranslocoTesting(options: TranslocoTestingOptions) {
  return makeEnvironmentProviders([
    provideTransloco({
      loader: TestingLoader,
      config: {
        prodMode: true,
        ...options.translocoConfig,
        missingHandler: {
          logMissingKey: false,
          ...options.translocoConfig?.missingHandler,
        },
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
    provideAppInitializer(() => {
      const initializerFn = initTranslocoService(
        inject(TranslocoService),
        injectTestLangs(),
        injectTestOptions(),
      );
      return initializerFn();
    }),
  ]);
}

/**
 * @deprecated Use {@link provideTranslocoTesting} and import the standalone
 * `TranslocoDirective` / `TranslocoPipe` directly instead.
 */
@NgModule({
  exports: [TranslocoModule],
})
export class TranslocoTestingModule {
  /**
   * @deprecated Use {@link provideTranslocoTesting} instead.
   */
  static forRoot(
    options: TranslocoTestingOptions,
  ): ModuleWithProviders<TranslocoTestingModule> {
    return {
      ngModule: TranslocoTestingModule,
      providers: [provideTranslocoTesting(options)],
    };
  }
}
