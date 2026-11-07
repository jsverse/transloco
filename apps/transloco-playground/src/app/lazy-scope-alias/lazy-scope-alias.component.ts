import { Component } from '@angular/core';

import { TranslocoDirective, provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'app-lazy-scope-alias',
  templateUrl: './lazy-scope-alias.component.html',
  styleUrls: ['lazy-scope-alias.component.scss'],
  providers: [
    provideTranslocoScope({ scope: 'lazy-scope-alias', alias: 'myScopeAlias' }),
  ],
  imports: [TranslocoDirective],
})
export default class LazyScopeAliasComponent {}
