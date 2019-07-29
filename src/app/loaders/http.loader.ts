import { HttpClient } from '@angular/common/http';
import { TRANSLOCO_LOADER } from '@ngneat/transloco';

export function HttpLoader(http: HttpClient) {
  return function(lang: string) {
    // if (lang === 'es') {
    //   return http.get(`/assets/i18n/assets/${lang}.json`);
    // }
    return http.get(`/assets/i18n/${lang}.json`);
  };
}

export const httpLoader = { provide: TRANSLOCO_LOADER, useFactory: HttpLoader, deps: [HttpClient] };
