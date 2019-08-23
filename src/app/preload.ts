import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoPersistLangService } from '../../projects/ngneat/transloco-persist-lang/src/lib/persist-lang.service';

export function preloadUser(userService: UserService, transloco: TranslocoService, p: TranslocoPersistLangService) {
  return function() {
    return userService.getUser().then(({ lang }) => {
      // const l = p.getCachedLang() || lang;
      // transloco.setActiveLang(l);
      return transloco.load(lang).toPromise();
    });
  };
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: preloadUser,
  deps: [UserService, TranslocoService, TranslocoPersistLangService]
};
