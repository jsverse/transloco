import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, Inject } from '@angular/core';
import { LOCALE_CURRENCY_MAPPING, Locale } from '@ngneat/transloco-locale';
import { TranslocoLocaleService } from '../../../../projects/ngneat/transloco-locale/src/lib/transloco-locale.service';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocaleComponent implements OnInit {
  public date = new Date(2019, 7, 14, 0, 0, 0, 0);
  public localeList: string[];

  constructor(private localeService: TranslocoLocaleService, @Inject(LOCALE_CURRENCY_MAPPING) localeMapping) {
    this.localeList = Object.keys(localeMapping);
  }

  ngOnInit() {}

  public setLocale(locale: Locale) {
    this.localeService.setLocale(locale);
  }
}
