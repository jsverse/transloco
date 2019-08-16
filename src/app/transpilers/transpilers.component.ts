import { Component } from '@angular/core';
import { TRANSLOCO_TRANSPILER, MessageFormatTranspiler } from '@ngneat/transloco';

@Component({
  selector: 'app-transpilers',
  templateUrl: './transpilers.component.html',
  styleUrls: ['./transpilers.component.css']
})
export class TranspilersComponent {
  dynamic = '🦄';
  key = 'home';
  userGender = 'female';

  changeKey() {
    this.key = this.key === 'home' ? 'fromList' : 'home';
  }

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
