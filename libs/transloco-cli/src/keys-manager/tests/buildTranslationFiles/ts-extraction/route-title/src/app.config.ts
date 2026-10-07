import { ApplicationConfig } from '@angular/core';
import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

export const appConfig: ApplicationConfig = {
  providers: [provideTranslocoTitleStrategy()],
};
