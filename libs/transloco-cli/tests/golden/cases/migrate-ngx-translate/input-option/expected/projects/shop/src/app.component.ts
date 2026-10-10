import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslocoService) {
    this.translate.setActiveLang('en');
    const hello = this.translate.translate('app.hello');
    this.translate.selectTranslate('app.title').subscribe((v) => console.log(v));
    const lang = this.translate.getActiveLang();
  }
}
