import { Component } from '@angular/core';

import { TranslocoDirective, provideTranslocoLang } from '@jsverse/transloco';

@Component({
  selector: 'app-provider-lang',
  templateUrl: './provider-lang.component.html',
  styleUrls: ['./provider-lang.component.scss'],
  providers: [provideTranslocoLang('es')],
  imports: [TranslocoDirective],
})
export class ProviderLangComponent {}
