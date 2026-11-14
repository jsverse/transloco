import { Component } from '@angular/core';

import {
  TranslocoDirective,
  TranslocoPipe,
  provideTranslocoScope,
} from '@jsverse/transloco';

@Component({
  selector: 'app-lazy-multiple-scopes',
  templateUrl: './lazy-multiple-scopes.component.html',
  styleUrls: ['./lazy-multiple-scopes.component.scss'],
  providers: [
    provideTranslocoScope(
      { scope: 'admin-page', alias: 'AdminPageAlias' },
      { scope: 'lazy-page', alias: 'LazyPageAlias' },
    ),
  ],
  imports: [TranslocoDirective, TranslocoPipe],
})
export default class LazyMultipleScopesComponent {}
