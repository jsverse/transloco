import '@angular/platform-browser-dynamic';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.conifg';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
