import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-dynamic-translation',
  templateUrl: './dynamic-translation.component.html',
  styleUrls: ['./dynamic-translation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTranslationComponent implements OnInit {
  constructor(private translate: TranslocoService) {}

  ngOnInit() {}

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
