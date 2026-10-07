import { Component } from '@angular/core';

// Regression fixture: a single file with more than one @Component class,
// each declaring its own inline template. All inline templates in the file
// must be extracted, not just the first one.
@Component({
  selector: 'first-inline',
  template: `<div transloco="24"></div>`,
})
export class FirstInlineComponent {}

@Component({
  selector: 'second-inline',
  template: `<div transloco="25"></div>`,
})
export class SecondInlineComponent {}
