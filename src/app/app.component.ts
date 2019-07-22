import { Component } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private s: TranslocoService) {}

  ngOnInit() {
    const v = this.s.translate('a.b.c', { value: 'dynamic' });
    console.log(v);
  }

  change(l) {
    this.s.setLang(l);
  }
}
