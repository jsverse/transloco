import "@angular/platform-browser-dynamic";
import {importProvidersFrom, isDevMode} from "@angular/core";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { ROUTES } from "./app/app.routes";
import {provideTransloco} from "@ngneat/transloco";
import {TranslocoHttpLoader} from "./app/transloco-loader";
import {TranslocoMessageFormatModule} from "@ngneat/transloco-messageformat";
import {TranslocoLocaleModule} from "@ngneat/transloco-locale";

bootstrapApplication(AppComponent, {
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
      loader: TranslocoHttpLoader
    }),
    importProvidersFrom(TranslocoMessageFormatModule.forRoot()),
    importProvidersFrom(TranslocoLocaleModule.forRoot({
      langToLocaleMapping: {
        en: 'en-US',
        es: 'es-ES',
      },
    })),
    provideRouter(ROUTES)
  ]
})
  .catch((err) => console.error(err));
