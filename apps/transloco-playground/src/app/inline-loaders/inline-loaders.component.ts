import { Component, OnInit, inject } from '@angular/core';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';

@Component({
  selector: 'app-inline',
  templateUrl: './inline-loaders.component.html',
  styleUrls: ['./inline-loaders.component.scss'],
  standalone: true,
  imports: [TranslocoModule],
})
export default class InlineLoadersComponent implements OnInit {
  translocoService = inject(TranslocoService);
  private scope = inject(TRANSLOCO_SCOPE);

  ngOnInit() {
    console.log(this.scope);
    this.translocoService
      .selectTranslate('title', {}, this.scope)
      .subscribe(console.log);
  }
}
