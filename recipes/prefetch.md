## Prefetch the User Language

We recommend pre-emptively fetching the user’s data from the server, including internationalization settings, and making it available to the components, before we allow the user to interact with them.

We want to ensure the data is available, because we don’t want to incur a bad user experience, such as jumpy content or flickering CSS.

Here's how you can achieve this using the `APP_INITIALIZER` token:

```ts
import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@ngneat/transloco';

export function preloadUser(userService: UserService, transloco: TranslocoService) {
  return function() {
    return userService.getUser().then(({ lang }) => {
      transloco.setActiveLang(lang);
      return transloco.load(lang).toPromise();
    }
  };
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: preloadUser,
  deps: [UserService, TranslocoService]
};
```

This will make sure the application doesn't bootstrap before Transloco loads the translation file based on the current user's language.

You can read more about it in [this article](https://netbasal.com/optimize-user-experience-while-your-angular-app-loads-7e982a67ff1a).
