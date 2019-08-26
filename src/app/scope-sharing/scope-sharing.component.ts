import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'scope-sharing',
  templateUrl: './scope-sharing.component.html',
  styleUrls: []
})
export class ScopeSharingComponent implements OnInit {
  ex = {
    one: `  <ng-container *transloco="let t">
    <p>{{ t.todosPage.title }}</p>
    // You can also access global scope translations!
    <p>{{ t.home }}</p>
  </ng-container>`,
    two: `  <ng-container *transloco="let t">
    <p>{{ t.todos.title }}</p>
    <p>{{ t.home }}</p>
  </ng-container>`
  };

  constructor() {}

  ngOnInit() {}
}
