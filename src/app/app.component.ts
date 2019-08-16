import { Component } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { take } from 'rxjs/operators';

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
    // Ensure new active lang is loaded
    this.service
      .load(lang)
      .pipe(take(1))
      .subscribe(() => {
        this.service.setActiveLang(lang);
      });
  }
}
