import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@ngneat/transloco';

export function getUser(userService: UserService, transloco: TranslocoService) {
  return function() {
    return userService.getUser().then(({ lang }) => transloco.setLangAndLoad(lang).toPromise());
  };
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: getUser,
  deps: [UserService, TranslocoService]
};
