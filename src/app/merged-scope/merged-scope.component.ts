import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'merged-scope',
  templateUrl: './merged-scope.component.html',
  styleUrls: []
})
export class MergedScopeComponent implements OnInit {
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
