import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { TranslocoLocaleService } from '../../../../projects/ngneat/transloco-locale/src/lib/transloco-locale.service';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocaleComponent implements OnInit {
  public date = new Date(2019, 7, 14, 0, 0, 0, 0);

  @ViewChild('locale') localeInput: ElementRef<HTMLInputElement>;

  constructor(private localeService: TranslocoLocaleService) {}

  ngOnInit() {}

  public setLocale() {
    this.localeService.setLocale(this.localeInput.nativeElement.value);
  }
}
