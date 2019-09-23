import { Component, OnDestroy } from '@angular/core';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  private subscription: Subscription = Subscription.EMPTY;
  availableLangs: AvailableLangs;

  constructor(private service: TranslocoService) {
    this.service.setAvailableLangs([
      {
        id: 'en',
        label: 'English'
      },
      {
        id: 'es',
        label: 'Spanish'
      }
    ]);

    this.availableLangs = this.service.getAvailableLangs();
  }

  get activeLang() {
    return this.service.getActiveLang();
  }

  change(lang: string) {
    // Ensure new active lang is loaded
    this.subscription.unsubscribe();
    this.subscription = this.service
      .load(lang)
      .pipe(take(1))
      .subscribe(() => {
        this.service.setActiveLang(lang);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
