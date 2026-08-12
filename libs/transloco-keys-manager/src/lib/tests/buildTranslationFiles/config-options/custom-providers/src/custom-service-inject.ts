import { Component, OnInit, inject } from '@angular/core';
import { TranslationsService } from '@app/shared/translations';

@Component({
  selector: 'custom-inject',
  template: ``,
})
export class CustomInjectComponent implements OnInit {
  private translations = inject(TranslationsService);

  ngOnInit() {
    this.translations.translate('custom-service.inject');
    this.translations.translate('1', {}, 'custom-page');
  }
}
