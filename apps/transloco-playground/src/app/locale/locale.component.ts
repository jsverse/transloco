import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';
import {
  TRANSLOCO_LOCALE_CURRENCY_MAPPING,
  LocaleToCurrencyMapping,
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

  constructor(
    private localeService: TranslocoLocaleService,
    @Inject(TRANSLOCO_LOCALE_CURRENCY_MAPPING)
    localeMapping: LocaleToCurrencyMapping,
  ) {
    this.localeList = Object.keys(localeMapping);
  }

  setLocale(event: Event) {
    this.localeService.setLocale((event.target as HTMLSelectElement).value);
  }

  get currencySymbol() {
    return this.localeService.getCurrencySymbol();
  }
}
