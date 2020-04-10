import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_LANG } from '@ngneat/transloco';

@Component({
  selector: 'provider-lang',
  templateUrl: './provider-lang.component.html',
  providers: [
    {
      provide: TRANSLOCO_LANG,
      useValue: 'es'
    }
  ],
  styleUrls: ['./provider-lang.component.css']
})
export class ProviderLangComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
