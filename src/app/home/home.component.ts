import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  dynamic = '🦄';
  key = 'home';

  constructor() {
  }

  ngOnInit() {
  }

  changeKey() {
    this.key = this.key === 'home' ? 'fromList' : 'home';
  }

  changeParam() {
    this.dynamic = this.dynamic === '🦄' ? '🦄🦄🦄' :'🦄';
  }
}
