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

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
