import { Component } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private service: TranslocoService) {}

  get activeLang() {
    return this.service.getActiveLang();
  }

  change(lang: string) {
    this.service.setActiveLang(lang);
  }
}
