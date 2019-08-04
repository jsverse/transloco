import {
  ComponentRef,
  TemplateRef,
  ViewContainerRef,
  ComponentFactoryResolver,
  Component,
  Injector,
  Type,
  ChangeDetectorRef
} from '@angular/core';
import { isString } from './helpers';
import { TranslocoLoaderComponent } from './loader-component.component';

export type Template = string | TemplateRef<any> | Type<any>;

export class TemplateHandler {
  private injector: Injector;

  constructor(private template: Template, private vcr: ViewContainerRef) {
    this.injector = this.vcr.injector;
  }

  public attachView() {
    if (this.isTemplateRef(this.template)) {
      this.vcr.createEmbeddedView(this.template as TemplateRef<any>);
    } else if (this.isComponent(this.template)) {
      this.createComponent(this.template as Type<any>);
    } else if (this.isHTML(this.template)) {
      const loaderCmp = this.createComponent<TranslocoLoaderComponent>(TranslocoLoaderComponent);
      loaderCmp.instance.html = this.template as string;
      const cdr = this.injector.get(ChangeDetectorRef);
      cdr && cdr.detectChanges();
    }
  }

  public detachView() {
    this.vcr.clear();
  }

  private createComponent<T>(cmp: Type<any>): ComponentRef<T> {
    const cfr = this.injector.get(ComponentFactoryResolver);
    const factory = cfr.resolveComponentFactory(cmp);

    return this.vcr.createComponent(factory);
  }

  private isTemplateRef(template: Template) {
    return template instanceof TemplateRef;
  }

  private isHTML(template: Template) {
    return isString(template);
  }

  private isComponent(template: Template) {
    return typeof template === 'function';
  }
}
