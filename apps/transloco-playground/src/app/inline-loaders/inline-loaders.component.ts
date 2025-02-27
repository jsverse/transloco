import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
  translateSignal,
} from '@jsverse/transloco';

@Component({
  selector: 'app-inline',
  templateUrl: './inline-loaders.component.html',
  styleUrls: ['./inline-loaders.component.scss'],
  standalone: true,
  imports: [TranslocoModule, AsyncPipe],
})
export default class InlineLoadersComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private scope = inject(TRANSLOCO_SCOPE);
  public title$ = this.translocoService
    .selectTranslate('title', {}, this.scope)
    .pipe(takeUntilDestroyed());

  public title = translateSignal('title');

  ngOnInit() {
    console.log(this.scope);
    this.title$.subscribe(console.log);
  }
}
