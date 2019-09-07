import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { isLocaleFormat } from './helpers';

@Injectable({
  providedIn: 'root'
})
export class TranslocoLocaleService {
  locale$: Observable<string>;

  constructor(private translocoService: TranslocoService) {
    this.locale$ = translocoService.langChanges$;
  }

  getLocale() {
    const locale = this.translocoService.getActiveLang();

    if (!isLocaleFormat(locale)) {
      throw new Error(`Given lang: ${locale} is not in a locale format`);
    }

    return locale;
  }
}
