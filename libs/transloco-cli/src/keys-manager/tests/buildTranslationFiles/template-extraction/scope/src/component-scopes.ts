import { Component } from '@angular/core';
import { TRANSLOCO_SCOPE, provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'scope4' },
    { provide: TRANSLOCO_SCOPE, useValue: { scope: 'scope5' } },
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'scope6', alias: 'scopeAlias6' },
    },
    provideTranslocoScope([
      'scope7',
      { scope: 'scope8' },
      { scope: 'scope9', alias: 'scopeAlias9' },
    ]),
  ],
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
