import { Component } from '@angular/core';
import { TRANSLOCO_LANG } from '@ngneat/transloco';

@Component({
  selector: 'app-provider-lang',
  templateUrl: './provider-lang.component.html',
  providers: [
    {
      provide: TRANSLOCO_LANG,
      useValue: 'es',
    },
  ],
})
export class ProviderLangComponent {}
