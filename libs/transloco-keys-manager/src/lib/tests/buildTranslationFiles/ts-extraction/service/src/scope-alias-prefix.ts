import { Component, OnInit, inject } from '@angular/core';
import { provideTranslocoScope, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'scope-alias-prefix-test',
  template: ``,
  providers: [provideTranslocoScope('service-prefixed')],
})
export class ScopeAliasPrefixTestClass implements OnInit {
  transloco = inject(TranslocoService);

  ngOnInit() {
    this.transloco.translate('servicePrefixed.translate');
    this.transloco.selectTranslate('servicePrefixed.select-translate');
    this.transloco.translate('servicePrefixed');
  }
}
