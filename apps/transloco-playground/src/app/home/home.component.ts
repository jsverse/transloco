import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  TranslocoModule,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule],
})
export class HomeComponent {
  dynamic = signal('🦄');
  key = signal('home');

  transloco = translateSignal('home');
  translocoObject = translateObjectSignal('nested');
  translocoParams = translateSignal('alert', { value: this.dynamic });
  translocoKeys = translateSignal(this.key);

  translateList = ['home', 'a.b.c', 'b', 'c'];

  changeKey() {
    this.key.update((key) => (key === 'home' ? 'fromList' : 'home'));
  }

  changeParam() {
    this.dynamic.update((dynamic) => (dynamic === '🦄' ? '🦄🦄🦄' : '🦄'));
  }
}
