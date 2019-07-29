import { TRANSLOCO_LOADER } from '@ngneat/transloco';

export function WebpackLoader() {
  return function(lang: string) {
    // Yeap it can work with typescript files
    return import(`../../assets/i18n/${lang}`).then(module => module.default);
  };
}

export const webpackLoader = { provide: TRANSLOCO_LOADER, useFactory: WebpackLoader };
