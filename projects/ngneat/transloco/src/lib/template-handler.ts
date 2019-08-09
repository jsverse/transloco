import {ComponentRef, TemplateRef, ViewContainerRef, ComponentFactoryResolver, Injector, Type} from '@angular/core';
import {isString} from './helpers';
import {TranslocoLoaderComponent} from './loader-component.component';

export type View = string | TemplateRef<any> | Type<any>;

export class TemplateHandler {
  private injector: Injector;

  constructor(private template: View, private vcr: ViewContainerRef) {
    this.injector = this.vcr.injector;
  }

  public attachView() {
    if (this.isTemplateRef(this.template)) {
      this.vcr.createEmbeddedView(this.template as TemplateRef<any>);
    } else if (isString(this.template)) {
      const componentRef = this.createComponent<TranslocoLoaderComponent>(TranslocoLoaderComponent);
      componentRef.instance.html = this.template as string;
      componentRef.hostView.detectChanges();
    } else {
      this.createComponent(this.template as Type<any>);
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

  private isTemplateRef(template: View) {
    return template instanceof TemplateRef;
  }

  private isHTML(template: View) {
    return isString(template);
  }

}
