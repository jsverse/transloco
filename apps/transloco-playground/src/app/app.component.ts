import { Component, OnDestroy } from '@angular/core';
import { LangDefinition, TranslocoService } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  private subscription: Subscription = Subscription.EMPTY;
  availableLangs: LangDefinition[];

  constructor(private service: TranslocoService) {
    this.availableLangs = this.service.getAvailableLangs() as LangDefinition[];
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
