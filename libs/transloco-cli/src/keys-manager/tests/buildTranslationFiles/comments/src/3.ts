import { Component, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'admin' }],
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor() {}

  /**
   * t(
   *  from.comment,
   *   pretty.cool.da
   * )
   */
  ngOnInit() {}
}
