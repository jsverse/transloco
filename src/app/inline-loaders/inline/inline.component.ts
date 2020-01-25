import { Component, OnInit, Inject } from '@angular/core';
import { TranslocoService, TRANSLOCO_SCOPE } from '@ngneat/transloco';

@Component({
  selector: 'app-inline',
  templateUrl: './inline.component.html'
})
export class InlineComponent implements OnInit {
  constructor(private translocoService: TranslocoService, @Inject(TRANSLOCO_SCOPE) private scope) {}

  ngOnInit() {
    this.translocoService.selectTranslate('title', {}, this.scope).subscribe(console.log);
  }
}
