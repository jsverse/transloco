import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';

import { TranslocoHttpLoader } from './transloco-loader';
import { ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
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
    provideTranslocoMessageformat(),
    provideRouter(ROUTES),
  ],
};
