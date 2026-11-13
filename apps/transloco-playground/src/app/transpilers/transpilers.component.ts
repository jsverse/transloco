import { Component, inject } from '@angular/core';

import {
  provideTranslocoScope,
  TRANSLOCO_TRANSPILER,
  TranslocoModule,
} from '@jsverse/transloco';
import { IntlMessageFormatTranspiler } from '@jsverse/transloco-intlmessageformat';

@Component({
  selector: 'app-transpilers',
  templateUrl: './transpilers.component.html',
  styleUrls: ['./transpilers.component.scss'],
  providers: [
    provideTranslocoScope({
      scope: 'transpilers/messageformat',
      alias: 'mf',
    }),
  ],
  imports: [TranslocoModule],
})
export default class TranspilersComponent {
  transpilerName =
    inject(TRANSLOCO_TRANSPILER) instanceof IntlMessageFormatTranspiler
      ? 'IntlMessageFormat'
      : 'MessageFormat';
  dynamic = '🦄';
  key = 'home';
  userGender = 'female';

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
