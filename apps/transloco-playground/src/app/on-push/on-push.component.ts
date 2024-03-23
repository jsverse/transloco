
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-on-push',
  templateUrl: './on-push.component.html',
  styleUrls: ['./on-push.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule],
})
export class OnPushComponent {
  isDocs = environment.isDocs;
  dynamic = '🦄';
  key = 'home';

  translateList = ['b', 'c'];

  changeKey() {
    this.key = this.key === 'home' ? 'fromList' : 'home';
  }

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
