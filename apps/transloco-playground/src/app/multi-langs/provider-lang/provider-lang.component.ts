import { Component } from '@angular/core';

import {
  TranslocoModule,
  provideTranslocoLang,
  translateSignal,
} from '@jsverse/transloco';

@Component({
  selector: 'app-provider-lang',
  templateUrl: './provider-lang.component.html',
  styleUrls: ['./provider-lang.component.scss'],
  providers: [provideTranslocoLang('es')],
  imports: [TranslocoModule],
})
export class ProviderLangComponent {
  // Picks up the TRANSLOCO_LANG provider above (no explicit lang argument).
  inProvider = translateSignal('home');
  // Inline lang wins over the TRANSLOCO_LANG provider, same as the directive below.
  inline = translateSignal('home', undefined, 'en');
}
