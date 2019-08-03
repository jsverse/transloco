import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-dynamic-translation',
  templateUrl: './dynamic-translation.component.html',
  styleUrls: ['./dynamic-translation.component.css']
})
export class DynamicTranslationComponent implements OnInit {
  constructor(private translate: TranslocoService) {
  }

  ngOnInit() {
  }

  updateTitle() {
    this.translate.setTranslationKey('home', 'New title');
  }

  addNewKey() {
    this.translate.setTranslationKey('newKey', 'New key');
  }

}
