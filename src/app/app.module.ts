import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TRANSLOCO_CONFIG, TRANSLOCO_TRANSPILER, TranslocoConfig, TranslocoModule } from '@ngneat/transloco';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { OnPushComponent } from './on-push/on-push.component';
import { HttpLoader, httpLoader } from './loaders/http.loader';
import { environment } from '../environments/environment';
import { TRANSLOCO_PERSIST_LANG_STORAGE, TranslocoPersistLangModule } from '@ngneat/transloco-persist-lang';
import { getLangFn } from './getLang';
import {
  PERSIST_TRANSLATIONS_STORAGE,
  TranslocoPersistTranslationsModule
} from '@ngneat/transloco-persist-translations';
import { TranslocoPreloadLangsModule } from '@ngneat/transloco-preload-langs';
import { TranslocoMessageFormatModule, MessageFormatTranspiler } from '@ngneat/transloco-messageformat';

@NgModule({
  declarations: [AppComponent, HomeComponent, OnPushComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TranslocoModule,
    TranslocoMessageFormatModule.init(),
    HttpClientModule,
    TranslocoLocaleModule.init({
      langToLocaleMapping: {
        en: 'en-US',
        es: 'es-ES'
      }
    })
    // TranslocoPreloadLangsModule.preload(['es', 'todos-page|scoped'])
    // TranslocoPersistLangModule.init({
    //   getLangFn,
    //   storage: {
    //     provide: TRANSLOCO_PERSIST_LANG_STORAGE,
    //     useValue: localStorage
    //   }
    // })
    // TranslocoPersistTranslationsModule.init({
    //   loader: HttpLoader,
    //   storage: {
    //     provide: PERSIST_TRANSLATIONS_STORAGE,
    //     useValue: localStorage
    //   }
    // })
  ],
  providers: [
    httpLoader,
    {
      provide: TRANSLOCO_CONFIG,
      useValue: {
        prodMode: environment.production,
        listenToLangChange: true,
        fallbackLang: 'es',
        defaultLang: 'en',
        scopeStrategy: 'shared',
        scopeMapping: {
          'todos-page': 'todos',
          'transpilers/messageformat': 'mf'
        }
      } as TranslocoConfig
    }
    // { provide: TRANSLOCO_TRANSPILER, useClass: MessageFormatTranspiler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
