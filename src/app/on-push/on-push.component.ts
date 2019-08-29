import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-on-push',
  templateUrl: './on-push.component.html',
  styleUrls: ['./on-push.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnPushComponent {
  dynamic = '🦄';
  key = 'home';

  constructor(private service: TranslocoService) {}

  translateList = ['b', 'c'];

  changeKey() {
    this.key = this.key === 'home' ? 'fromList' : 'home';
  }

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
