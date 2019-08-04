import {
  ComponentRef,
  TemplateRef,
  ViewContainerRef,
  ComponentFactoryResolver,
  Component,
  Injector
} from '@angular/core';
import { LoaderComponent } from './loaderComponent.component';

export class TemplateHandler {
  constructor(
    private template: string | TemplateRef<any> | Component,
    private vcr: ViewContainerRef,
    private injector: Injector
  ) {}

  public attachView() {
    if (this.isTemplateRef(this.template)) {
      this.vcr.createEmbeddedView(this.template as TemplateRef<any>);
    } else if (this.isComponent(this.template)) {
      this.createComponent(this.template);
    } else if (this.isHTML(this.template)) {
      const loaderCmp = this.createComponent<LoaderComponent>(LoaderComponent);
      loaderCmp.instance.html = this.template as string;
    }
  }

  public detachView() {
    this.vcr.clear();
  }

  private createComponent<T>(cmp): ComponentRef<T> {
    const cfr = this.injector.get(ComponentFactoryResolver);
    const component = cfr.resolveComponentFactory(cmp);

    return this.vcr.createComponent(component);
  }

  private isTemplateRef(template: string | TemplateRef<any> | Component) {
    return template instanceof TemplateRef;
  }

  private isHTML(template: string | TemplateRef<any> | Component) {
    return typeof template === 'string';
  }

  private isComponent(template: string | TemplateRef<any> | Component) {
    return typeof template === 'function';
  }
}
