import { Component } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { ProviderLangComponent } from './provider-lang/provider-lang.component';

@Component({
  selector: 'app-multilangs',
  templateUrl: './multi-langs.component.html',
  styleUrls: ['./multi-langs.component.scss'],
  standalone: true,
  imports: [TranslocoModule, ProviderLangComponent],
})
export default class MultilangsComponent {}
