import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TRANSLOCO_CONFIG, TranslocoConfig, TranslocoModule } from '@ngneat/transloco';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { PageComponent } from './page/page.component';
import { OnPushComponent } from './on-push/on-push.component';
import { httpLoader } from './loaders/http.loader';
import { preLoad } from './preload';
import { environment } from '../environments/environment';
import { webpackLoader } from './loaders/webpack.loader';

@NgModule({
  declarations: [AppComponent, HomeComponent, PageComponent, OnPushComponent],
  imports: [BrowserModule, AppRoutingModule, TranslocoModule, HttpClientModule],
  providers: [
    preLoad,
    httpLoader,
    // webpackLoader,
    {
      provide: TRANSLOCO_CONFIG,
      useValue: {
        prodMode: environment.production,
        runtime: true,
        defaultLang: 'en'
      } as TranslocoConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
