import {
  ComponentRef,
  TemplateRef,
  ViewContainerRef,
  ComponentFactoryResolver,
  Injector,
  Type,
} from '@angular/core';
import { isString } from './helpers';
import { TranslocoLoaderComponent } from './loader-component.component';

export type View = string | TemplateRef<unknown> | Type<unknown>;

export class TemplateHandler {
  private injector: Injector;

  constructor(private view: View, private vcr: ViewContainerRef) {
    this.injector = this.vcr.injector;
  }

  attachView() {
    if (this.view instanceof TemplateRef) {
      this.vcr.createEmbeddedView(this.view);
    } else if (isString(this.view)) {
      const componentRef = this.createComponent<TranslocoLoaderComponent>(
        TranslocoLoaderComponent
      );
      componentRef.instance.html = this.view;
      componentRef.hostView.detectChanges();
    } else {
      this.createComponent(this.view);
    }
  }

  detachView() {
    this.vcr.clear();
  }

  private createComponent<T>(cmp: Type<T>): ComponentRef<T> {
    const cfr = this.injector.get(ComponentFactoryResolver);
    const factory = cfr.resolveComponentFactory(cmp);

    return this.vcr.createComponent(factory);
  }
}
