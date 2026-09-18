import { ApplicationConfig } from '@angular/core';
// The provider is only imported and mentioned in a comment below - it's
// never actually called, so `provideTranslocoTitleStrategy()`-detection must
// treat this project as NOT using the title strategy.
import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

// providers: [provideTranslocoTitleStrategy()],

export const appConfig: ApplicationConfig = {
  providers: [],
};
