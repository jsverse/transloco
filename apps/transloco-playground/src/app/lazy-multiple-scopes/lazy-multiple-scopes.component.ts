import { Component } from '@angular/core';

import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'app-lazy-multiple-scopes',
  templateUrl: './lazy-multiple-scopes.component.html',
  styleUrls: ['./lazy-multiple-scopes.component.scss'],
  providers: [
    provideTranslocoScope({ scope: 'admin-page', alias: 'AdminPageAlias' }),
    provideTranslocoScope({ scope: 'lazy-page', alias: 'LazyPageAlias' }),
  ],
  standalone: true,
  imports: [TranslocoModule],
})
export default class LazyMultipleScopesComponent {}
