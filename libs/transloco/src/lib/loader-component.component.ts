import { Component, Input } from '@angular/core';

@Component({
  template: `
    <div class="transloco-loader-template" [innerHTML]="html"></div>
  `,
  standalone: true,
})
export class TranslocoLoaderComponent {
  @Input() html: string | undefined;
}
