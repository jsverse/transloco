import { Component, Input } from '@angular/core';

@Component({
  template: `
    <div class="transloco-loader-template" [innerHTML]="html"></div>
  `,
})
export class TranslocoLoaderComponent {
  @Input() html: string | undefined;
}
