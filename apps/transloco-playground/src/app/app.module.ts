import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { OnPushComponent } from './on-push/on-push.component';
import { TranslocoRootModule } from './transloco-root.module';

@NgModule({
  declarations: [AppComponent, HomeComponent, OnPushComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TranslocoRootModule,
    HttpClientModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
