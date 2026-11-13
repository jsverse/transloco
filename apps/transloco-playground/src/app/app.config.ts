import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoIntlMessageFormat } from '@jsverse/transloco-intlmessageformat';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';

import { TranslocoHttpLoader } from './transloco-loader';
import { ROUTES } from './app.routes';

const useIntlMessageFormat =
  new URLSearchParams(window.location.search).get('transpiler') === 'intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(BrowserModule),
    provideHttpClient(),
    provideTransloco({
      config: {
        prodMode: !isDevMode(),
        availableLangs: [
          { id: 'en', label: 'English' },
          { id: 'es', label: 'Spanish' },
        ],
        reRenderOnLangChange: true,
        fallbackLang: 'es',
        defaultLang: 'en',
        missingHandler: {
          useFallbackTranslation: false,
        },
        // interpolation: ['<<<', '>>>']
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoLocale({
      langToLocaleMapping: {
        en: 'en-US',
        es: 'es-ES',
      },
    }),
    useIntlMessageFormat
      ? provideTranslocoIntlMessageFormat()
      : provideTranslocoMessageformat(),
    // provideTranslocoPersistLang({
    //   storage: {
    //     useValue: cookiesStorage(),
    //   }
    // }),
    provideRouter(ROUTES),
  ],
};
