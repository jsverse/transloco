import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";
import {
  LOCALE_CURRENCY_MAPPING,
  LocaleToCurrencyMapping,
  TranslocoLocaleService,
  TranslocoLocaleModule
} from "@ngneat/transloco-locale";

@Component({
  selector: "app-locale",
  templateUrl: "./locale.component.html",
  styleUrls: ["./locale.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslocoModule, TranslocoLocaleModule]
})
export default class LocaleComponent {
  date = new Date(2019, 7, 14, 0, 0, 0, 0);
  localeList: string[];

  constructor(
    private localeService: TranslocoLocaleService,
    @Inject(LOCALE_CURRENCY_MAPPING) localeMapping: LocaleToCurrencyMapping
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
