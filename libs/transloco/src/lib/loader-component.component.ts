import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  template: `
    <div class="transloco-loader-template" [innerHTML]="html()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslocoLoaderComponent {
  readonly html = input<string>();
}
