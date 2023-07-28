import { TemplateRef, Type, ViewContainerRef } from '@angular/core';

import { isString } from './helpers';
import { TranslocoLoaderComponent } from './loader-component.component';

export type Content = string | TemplateRef<unknown> | Type<unknown>;

export class TemplateHandler {
  constructor(private view: Content, private vcr: ViewContainerRef) {}

  attachView() {
    if (this.view instanceof TemplateRef) {
      this.vcr.createEmbeddedView(this.view);
    } else if (isString(this.view)) {
      const componentRef = this.vcr.createComponent(TranslocoLoaderComponent);
      componentRef.instance.html = this.view;
      componentRef.hostView.detectChanges();
    } else {
      this.vcr.createComponent(this.view);
    }
  }

  detachView() {
    this.vcr.clear();
  }
}
