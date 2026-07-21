import { Component } from '@angular/core';

import { TranslocoModule, translateSignal } from '@jsverse/transloco';

import { ProviderLangComponent } from './provider-lang/provider-lang.component';

@Component({
  selector: 'app-multilangs',
  templateUrl: './multi-langs.component.html',
  styleUrls: ['./multi-langs.component.scss'],
  imports: [TranslocoModule, ProviderLangComponent],
})
export default class MultilangsComponent {
  global = translateSignal('home');
  // 'lazy-page/es' is translateSignal's fully-resolved `scope/lang` combo form -
  // the equivalent of the directive's separate `lang: 'es'; scope: 'lazy-page'` inputs.
  withScope = translateSignal('title', undefined, 'lazy-page/es');
}
