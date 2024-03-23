import { Component } from '@angular/core';

import { TranslocoModule, provideTranslocoLang } from '@jsverse/transloco';

@Component({
  selector: 'app-provider-lang',
  templateUrl: './provider-lang.component.html',
  styleUrls: ['./provider-lang.component.scss'],
  providers: [provideTranslocoLang('es')],
  standalone: true,
  imports: [TranslocoModule],
})
export class ProviderLangComponent {}
