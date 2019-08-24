import { HttpClient } from '@angular/common/http';
import { InjectionToken, Injectable } from '@angular/core';
import { TRANSLOCO_LOADER, TranslocoLoader, Translation } from '@ngneat/transloco';
import { translocoPersistTranslationsFactory } from '../../../projects/ngneat/transloco-persist-translations/src/public-api';

@Injectable()
export class HttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(langPath: string) {
    return this.http.get<Translation>(`/assets/i18n/${langPath}.json`);
  }
}

export function translocoLoaderFactory(loader: TranslocoLoader) {
  return translocoPersistTranslationsFactory(loader, localStorage);
}
export const cacheLoaderProviders = [
  HttpLoader,
  {
    provide: TRANSLOCO_LOADER,
    deps: [HttpLoader],
    useFactory: translocoLoaderFactory
  }
];
