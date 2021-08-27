import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@ngneat/transloco';

export function preloadUser(
  userService: UserService,
  transloco: TranslocoService
) {
  return () =>
    userService.getUser().then(({ lang }) => {
      return transloco.load(lang).toPromise();
    });
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: preloadUser,
  deps: [UserService, TranslocoService],
};
