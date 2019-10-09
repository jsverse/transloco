import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

export function en() {
  return import('../translation/en.json').then(res => res.default);
}

export function es() {
  return import('../translation/es.json').then(res => res.default);
}

@Component({
  selector: 'app-inline',
  templateUrl: './inline.component.html',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useFactory: () => ({
        scope: 'inline',
        translations: { en, es }
      })
    }
  ],
  styleUrls: ['./inline.component.css']
})
export class InlineComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
