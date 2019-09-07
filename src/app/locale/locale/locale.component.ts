import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-locale',
  templateUrl: './locale.component.html',
  styleUrls: ['./locale.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocaleComponent implements OnInit {
  public date = new Date();

  constructor() {}

  ngOnInit() {}
}
