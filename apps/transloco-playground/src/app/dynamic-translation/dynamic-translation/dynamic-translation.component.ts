import {ChangeDetectionStrategy, Component} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';

@Component({
  selector: 'app-dynamic-translation',
  templateUrl: './dynamic-translation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTranslationComponent {
  constructor(private translate: TranslocoService) {}

  updateTitle() {
    this.translate.setTranslationKey('home', 'New title');
  }

  addNewKey() {
    this.translate.setTranslationKey('newKey', 'New key');
  }

  addTranslationObj() {
    const newTranslation = {
      newTranslation: {
        title: 'New translation title'
      }
    };
    this.translate.setTranslation(newTranslation, 'en', { merge: true });
  }
}
