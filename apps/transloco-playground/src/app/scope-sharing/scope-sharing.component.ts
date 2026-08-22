import { Component } from '@angular/core';

import { TranslocoModule, translateSignal } from '@jsverse/transloco';

@Component({
  selector: 'app-scope-sharing',
  templateUrl: './scope-sharing.component.html',
  styleUrls: ['./scope-sharing.component.scss'],
  imports: [TranslocoModule],
})
export default class ScopeSharingComponent {
  // Auto-prefixed via the route-provided scope's *explicit* alias ('todos',
  // not the 'todosPage' the scope name 'todos-page' would auto-camelCase to).
  //
  // Unlike the directive/pipe above (which never auto-prefix - they always
  // require a manual key or `prefix`), translateSignal has no way to reach a
  // truly global key while a scope is ambiently provided: any active scope
  // (explicit or via TRANSLOCO_SCOPE) always gets prefixed onto the key, so
  // there's no signal equivalent of the Directive/Pipe rows' unprefixed
  // `t('home')`/`'home' | transloco` here.
  todosTitle = translateSignal('title');
}
