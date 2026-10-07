import { Component, inject } from '@angular/core';
import { translate, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly transloco = inject(TranslocoService);

  cancel = translate('actions.cancel');
  documentTitle = this.transloco.translate('home.documentTitle');
}
