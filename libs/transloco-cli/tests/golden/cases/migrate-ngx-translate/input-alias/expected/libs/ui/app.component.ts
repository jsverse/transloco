import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { take } from 'rxjs';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslocoService) {
    this.translate.setActiveLang('en');
    const hello = this.translate.translate('app.hello');
    this.translate.selectTranslate('app.title').pipe(take(1)).subscribe((v) => console.log(v));
    const lang = this.translate.getActiveLang();
  }
}
