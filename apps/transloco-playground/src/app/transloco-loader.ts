import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(
      `${environment.baseUrl}/assets/i18n/${lang}.json`
    );
  }
}
