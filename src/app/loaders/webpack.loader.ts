import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from '@ngneat/transloco';

export class WebpackLoader implements TranslocoLoader {
  getTranslation(lang: string): Promise<Translation> {
    return import(`../../assets/i18n/${lang}`).then(module => module.default);
  }
}

export const webpackLoader = { provide: TRANSLOCO_LOADER, useClass: WebpackLoader };
