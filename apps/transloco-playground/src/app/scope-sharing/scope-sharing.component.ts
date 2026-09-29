import { Component } from '@angular/core';

import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-scope-sharing',
  templateUrl: './scope-sharing.component.html',
  styleUrls: ['./scope-sharing.component.scss'],
  imports: [TranslocoDirective, TranslocoPipe],
})
export default class ScopeSharingComponent {}
