import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';
import {
  TRANSLOCO_LOCALE_CURRENCY_MAPPING,
  TranslocoLocaleService,
  TranslocoLocaleModule,
} from '@jsverse/transloco-locale';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, TranslocoLocaleModule],
})
export default class LocaleComponent {
  date = new Date(2019, 7, 14, 0, 0, 0, 0);
  localeList: string[];

  private localeService = inject(TranslocoLocaleService);

  constructor() {
    const localeMapping = inject(TRANSLOCO_LOCALE_CURRENCY_MAPPING);
    this.localeList = Object.keys(localeMapping);
  }

  setLocale(event: Event) {
    this.localeService.setLocale((event.target as HTMLSelectElement).value);
  }

  get currencySymbol() {
    return this.localeService.getCurrencySymbol();
  }
}
