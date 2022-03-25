import { Injectable } from '@angular/core';
import { timer, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  getUser() {
    return timer(500)
      .pipe(
        map(() => {
          return {lang: 'en'};
        })
      );
  }
}
