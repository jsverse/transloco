import { Component, OnInit, Inject } from '@angular/core';
import { TranslocoService, TRANSLOCO_SCOPE } from '@ngneat/transloco';

@Component({
  selector: 'app-dynamic-translation',
  templateUrl: './dynamic-translation.component.html',
  styleUrls: ['./dynamic-translation.component.css']
})
export class DynamicTranslationComponent implements OnInit {
  constructor(private translate: TranslocoService, @Inject(TRANSLOCO_SCOPE) public scope: string) {}

  ngOnInit() {}

  public updateTitle() {
    const lang = this.translate.getActiveLang();
    this.translate.setTranslationKey(lang, 'title', 'new title', this.scope);
  }

  public addScopeTranslation() {
    const lang = this.translate.getActiveLang();
    this.translate.setTranslationKey(lang, 'title', 'new title');
  }

  public setScopeTranslation() {
    const lang = this.translate.getActiveLang();
    this.translate.setTranslationKey(lang, 'title', 'new title');
  }

  public overrideScopeTranslation() {
    const lang = this.translate.getActiveLang();
    this.translate.setTranslationKey(lang, 'title', 'new title');
  }
}
