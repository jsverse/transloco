import { Component, DestroyRef, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LangDefinition, TranslocoService } from '@jsverse/transloco';

import { AppSrcDirective } from './app-src.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, AppSrcDirective],
})
export class AppComponent {
  private destroyRef = inject(DestroyRef);
  service = inject(TranslocoService);
  availableLangs = this.service.getAvailableLangs() as LangDefinition[];

  get activeLang() {
    return this.service.getActiveLang();
  }

  changeLang(lang: string) {
    // Ensure new active lang is loaded
    this.service
      .load(lang)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.service.setActiveLang(lang);
      });
  }
}
