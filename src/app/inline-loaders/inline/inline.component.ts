import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

function loader() {
  return ['en', 'es'].reduce((acc, lang) => {
    acc[lang] = () => import(`../i18n/${lang}.json`);
    return acc;
  }, {});
}

@Component({
  selector: 'app-inline',
  templateUrl: './inline.component.html',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'inline',
        loader: loader()
      }
    }
  ]
})
export class InlineComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
