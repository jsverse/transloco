import { Component, input } from '@angular/core';

@Component({
  template: `
    <div class="transloco-loader-template" [innerHTML]="html()"></div>
  `,
})
export class TranslocoLoaderComponent {
  readonly html = input<string>();
}
