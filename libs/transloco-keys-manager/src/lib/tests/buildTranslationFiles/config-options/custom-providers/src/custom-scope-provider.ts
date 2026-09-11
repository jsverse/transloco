import { Component } from '@angular/core';
import { provideScopedTranslations } from '@app/shared/translations';

@Component({
  selector: 'app-custom-scopes',
  templateUrl: './custom-scopes.component.html',
  providers: [
    provideScopedTranslations('custom-page'),
    provideScopedTranslations({ scope: 'other-page', alias: 'other' }),
  ],
})
export class CustomScopesComponent {}
