import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

@Component({
  selector: 'app-lazy-scope-alias',
  templateUrl: './lazy-scope-alias.component.html',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'lazy-scope-alias', alias: 'myScopeAlias' } }]
})
export class LazyScopeAliasComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
