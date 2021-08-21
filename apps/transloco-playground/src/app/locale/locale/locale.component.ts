import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {LOCALE_CURRENCY_MAPPING, LocaleToCurrencyMapping, TranslocoLocaleService} from '@ngneat/transloco-locale';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocaleComponent {
  date = new Date(2019, 7, 14, 0, 0, 0, 0);
  localeList: string[];

  constructor(private localeService: TranslocoLocaleService, @Inject(LOCALE_CURRENCY_MAPPING) localeMapping: LocaleToCurrencyMapping) {
    this.localeList = Object.keys(localeMapping);
  }
  
  setLocale(event: Event) {
    this.localeService.setLocale((event.target as HTMLSelectElement).value);
  }

  get currencySymbol() {
    return this.localeService.getCurrencySymbol();
  }
}
