import { Component } from '@angular/core';

@Component({
  selector: 'app-transpilers',
  templateUrl: './transpilers.component.html',
  styleUrls: ['./transpilers.component.scss']
})
export class TranspilersComponent {
  dynamic = '🦄';
  key = 'home';
  userGender = 'female';

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
