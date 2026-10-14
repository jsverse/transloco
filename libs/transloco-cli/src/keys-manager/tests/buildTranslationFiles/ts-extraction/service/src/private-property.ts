import { Component, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'private-class-field-test',
  template: ``,
})
export class PrivateClassFieldInjectTestClass implements OnInit {
  #transloco = inject(TranslocoService);

  ngOnInit() {
    this.#transloco.translate('private-class-field.test');
  }
}
