import { Injectable } from '@angular/core';
import { timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor() {}

  getUser() {
    return timer(500)
      .pipe(
        mapTo({
          lang: 'es'
        })
      )
      .toPromise();
  }
}
