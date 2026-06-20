import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

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
  imports: [TranslocoModule, TranslocoLocaleModule],
})
export default class LocaleComponent {
  private localeService = inject(TranslocoLocaleService);

  date = new Date(2019, 7, 14, 0, 0, 0, 0);
  localeList = Object.keys(
    inject<LocaleToCurrencyMapping>(TRANSLOCO_LOCALE_CURRENCY_MAPPING),
  );

  setLocale(event: Event) {
    this.localeService.setLocale((event.target as HTMLSelectElement).value);
  }

  get currencySymbol() {
    return this.localeService.getCurrencySymbol();
  }
}
