import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  lang = new BehaviorSubject<string>('en');
  lang$ = this.lang.asObservable();

  setLang(lang: string) {
    this.lang.next(lang);
  }
}
