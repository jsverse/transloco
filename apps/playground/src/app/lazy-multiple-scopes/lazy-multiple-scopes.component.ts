import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

@Component({
  selector: 'app-lazy-multiple-scopes',
  templateUrl: './lazy-multiple-scopes.component.html',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: { scope: 'admin-page', alias: 'AdminPageAlias' }, multi: true },
    { provide: TRANSLOCO_SCOPE, useValue: { scope: 'lazy-page', alias: 'LazyPageAlias' }, multi: true }
  ]
})
export class LazyMultipleScopesComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
