import { Component } from '@angular/core';
import { TranslateService } from './translate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngx-translate';

  constructor(private s: TranslateService) {}

  change(l) {
    this.s.setLang(l);
  }
}
