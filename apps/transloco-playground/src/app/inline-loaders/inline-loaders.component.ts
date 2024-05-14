import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@jsverse/transloco';

@Component({
  selector: 'app-inline',
  templateUrl: './inline-loaders.component.html',
  styleUrls: ['./inline-loaders.component.scss'],
  standalone: true,
  imports: [TranslocoModule],
})
export default class InlineLoadersComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private scope = inject(TRANSLOCO_SCOPE);
  private title$ = this.translocoService
    .selectTranslate('title', {}, this.scope)
    .pipe(takeUntilDestroyed());

  ngOnInit() {
    console.log(this.scope);
    this.title$.subscribe(console.log);
  }
}
