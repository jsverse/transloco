import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, Inject } from '@angular/core';
import { LOCALE_CURRENCY_MAPPING, Locale, LocaleToCurrencyMapping } from '@ngneat/transloco-locale';
import { TranslocoLocaleService } from '@ngneat/transloco-locale';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocaleComponent implements OnInit {
  date = new Date(2019, 7, 14, 0, 0, 0, 0);
  localeList: string[];

  constructor(private localeService: TranslocoLocaleService, @Inject(LOCALE_CURRENCY_MAPPING) localeMapping: LocaleToCurrencyMapping) {
    this.localeList = Object.keys(localeMapping);
  }

  ngOnInit() {}

  setLocale(event: Event) {
    this.localeService.setLocale((event.target as HTMLSelectElement).value);
  }

  get currencySymbol() {
    return this.localeService.getCurrencySymbol();
  }
}
