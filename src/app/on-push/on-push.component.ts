import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-on-push',
  templateUrl: './on-push.component.html',
  styleUrls: ['./on-push.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnPushComponent implements OnInit {
  dynamic = '🦄';
  key = 'home';
  translateList = ['b', 'c'];

  constructor() {}

  ngOnInit() {}

  changeKey() {
    this.key = this.key === 'home' ? 'fromList' : 'home';
  }

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' : '🦄';
  }
}
