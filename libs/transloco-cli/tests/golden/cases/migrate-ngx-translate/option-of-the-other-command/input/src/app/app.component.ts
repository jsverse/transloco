import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  constructor(private translate: TranslateService) {
    this.translate.use('en');
    const hello = this.translate.instant('app.hello');
    this.translate.get('app.title').subscribe((v) => console.log(v));
    const lang = this.translate.currentLang;
  }
}
