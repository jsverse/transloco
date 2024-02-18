import { Component } from '@angular/core';

import { TranslocoModule, provideTranslocoScopes } from '@ngneat/transloco';

@Component({
  selector: 'app-lazy-multiple-scopes',
  templateUrl: './lazy-multiple-scopes.component.html',
  styleUrls: ['./lazy-multiple-scopes.component.scss'],
  providers: [
    provideTranslocoScopes({ scope: 'admin-page', alias: 'AdminPageAlias' }, { scope: 'lazy-page', alias: 'LazyPageAlias' }),
  ],
  standalone: true,
  imports: [TranslocoModule],
})
export default class LazyMultipleScopesComponent {}
