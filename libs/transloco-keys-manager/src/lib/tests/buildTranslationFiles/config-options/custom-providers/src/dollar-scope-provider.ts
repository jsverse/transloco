import { Component } from '@angular/core';
import { $provideScope } from '@app/shared/translations';

@Component({
  selector: 'app-dollar-scope',
  template: ``,
  providers: [$provideScope('dollar-page')],
})
export class DollarScopeComponent {}
