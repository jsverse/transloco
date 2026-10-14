import { Component } from '@angular/core';
import { translate } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    translate('1');
  }

  getString(): string {
    return '9';
  }

  extractionProblem(): void {
    translate('2');
    const foo = <string>this.getString();
    translate(['3', '4']);
  }
}
