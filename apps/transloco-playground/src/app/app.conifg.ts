import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '../../../../libs/transloco/src';
import { TranslocoHttpLoader } from './transloco-loader';
import { TranslocoMessageFormatModule } from '../../../../libs/transloco-messageformat/src';
import { provideTranslocoLocale } from '../../../../libs/transloco-locale/src';
import { provideRouter } from '@angular/router';
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
    importProvidersFrom(TranslocoMessageFormatModule.forRoot()),
    provideRouter(ROUTES),
  ],
};
