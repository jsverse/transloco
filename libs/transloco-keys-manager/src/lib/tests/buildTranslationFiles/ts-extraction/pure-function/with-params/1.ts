import { Component } from '@angular/core';
import { translate } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    translate('1', { 1: '' });
    translate(['2'], { 2: '' });
  }

  getString(): string {
    return '9';
  }

  extractionProblem(): void {
    const foo = <string>this.getString();
    translate('4', { foo: '', a: '', b: { c: '' } });
  }
}

translate('3', { 3: '' });
