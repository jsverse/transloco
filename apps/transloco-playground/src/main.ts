import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.conifg';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [provideZoneChangeDetection(), ...appConfig.providers],
}).catch((err) => console.error(err));
