import { Component } from '@angular/core';

import { TranslocoDirective } from '@jsverse/transloco';

import { ProviderLangComponent } from './provider-lang/provider-lang.component';

@Component({
  selector: 'app-multilangs',
  templateUrl: './multi-langs.component.html',
  styleUrls: ['./multi-langs.component.scss'],
  imports: [TranslocoDirective, ProviderLangComponent],
})
export default class MultilangsComponent {}
