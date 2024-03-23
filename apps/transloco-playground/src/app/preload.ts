import { APP_INITIALIZER } from '@angular/core';
import { switchMap } from 'rxjs';

import { TranslocoService } from '@jsverse/transloco';

import { UserService } from './user.service';

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
