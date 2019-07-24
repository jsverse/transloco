import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  TranslocoModule,
  TRANSLOCO_LOADER,
  TRANSLOCO_CONFIG,
  TranslocoConfig,
  TranslocoService
} from '@ngneat/transloco';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { HomeComponent } from './home/home.component';
import { PageComponent } from './page/page.component';

export function HttpLoader(http: HttpClient) {
  return function(lang: string) {
    // if (lang === 'es') {
    //   return http.get(`/assets/langs/assets/${lang}.json`);
    // }
    return http.get(`/assets/langs/${lang}.json`);
  };
}

export function WebpackLoader() {
  return function(lang: string) {
    // need to check whether webpack includes each chunk in the main bundle
    return import(`../assets/langs/${lang}.json`);
  };
}

export function getUser(userService: UserService, transloco: TranslocoService) {
  return function() {
    return userService.getUser().then(({ lang }) => transloco.setLangAndLoad(lang).toPromise());
  };
}

@NgModule({
  declarations: [AppComponent, HomeComponent, PageComponent],
  imports: [BrowserModule, AppRoutingModule, TranslocoModule, HttpClientModule],
  providers: [
    // {
    //   provide: APP_INITIALIZER,
    //   multi: true,
    //   useFactory: getUser,
    //   deps: [UserService, TranslocoService]
    // },
    { provide: TRANSLOCO_LOADER, useFactory: HttpLoader, deps: [HttpClient] },
    // { provide: TRANSLOCO_LOADER, useFactory: WebpackLoader },
    {
      provide: TRANSLOCO_CONFIG,
      useValue: {
        runtime: true,
        defaultLang: 'en'
      } as TranslocoConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
