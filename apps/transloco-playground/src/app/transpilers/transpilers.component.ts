import { Component } from '@angular/core';

import {
  provideTranslocoScope,
  TranslocoDirective,
  TranslocoPipe,
} from '@jsverse/transloco';

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
  imports: [TranslocoDirective, TranslocoPipe],
})
export default class TranspilersComponent {
  dynamic = '🦄';
  key = 'home';
  userGender = 'female';

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
