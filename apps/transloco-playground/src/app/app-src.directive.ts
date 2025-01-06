import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';

import { environment } from '../environments/environment';

@Directive({
  selector: 'img[appSrc]',
  standalone: true,
})
export class AppSrcDirective implements OnInit {
  host = inject(ElementRef).nativeElement as HTMLImageElement;
  appSrc = input<string>();

  ngOnInit() {
    this.host.src = `${environment.baseUrl}/${this.appSrc()}`;
  }
}
