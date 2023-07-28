import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@ngneat/transloco';
import { switchMap } from 'rxjs';

export function preloadUser(
  userService: UserService,
  transloco: TranslocoService
) {
  return () =>
    userService.getUser().pipe(switchMap(({ lang }) => transloco.load(lang)));
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: preloadUser,
  deps: [UserService, TranslocoService],
};
