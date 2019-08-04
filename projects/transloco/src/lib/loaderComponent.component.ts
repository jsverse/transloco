import { Component, Input, ChangeDetectorRef } from '@angular/core';

@Component({
  template: `
    <div class="transloco-loader-template" [innerHTML]="html"></div>
  `
})
export class LoaderComponent {
  private _html: string;

  @Input() set html(html: string) {
    this._html = html;
    this.cdr.markForCheck();
  }

  get html() {
    return this._html;
  }

  constructor(private cdr: ChangeDetectorRef) {}
}
