# Prefetch User Language

To enhance user experience, it's recommended to preload the user's data, including internationalization settings, before allowing interaction with components. This ensures that the necessary data is available upfront, preventing issues like jumpy content or flickering CSS.

You can achieve this by utilizing the `APP_INITIALIZER` token, which runs initialization logic before the app is bootstrapped.

Here’s how you can implement it:

{% tabs %}
{% tab title="Angular >=19" %}
{% code overflow="wrap" %}
```typescript
import { provideAppInitializer } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@jsverse/transloco';

export function preloadUser(userService: UserService, transloco: TranslocoService) {
  return async () => {
    const config = await userService.getUser();
    // Set the language
    transloco.setActiveLang(config.lang);
    // Load the translation file
    await transloco.load(config.lang);
  };
}

export const preLoad = provideAppInitializer(preloadUser, [UserService, TranslocoService]);
```
{% endcode %}
{% endtab %}

{% tab title="Angualr <19" %}
```typescript
import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@jsverse/transloco';

export function preloadUser(userService: UserService, transloco: TranslocoService) {
  return async function() {
     const config = await userService.getUser();
     // Set the language
     transloco.setActiveLang(config.lang);
     // Load the translation file
     await transloco.load(lang);
    };
  };
}

export const preLoad = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: preloadUser,
  deps: [UserService, TranslocoService]
};
```
{% endtab %}
{% endtabs %}

#### Explanation:

* The `preloadUser` function ensures that the user's language settings are fetched from the server, and the corresponding translation file is loaded before the application starts.
* This guarantees that the app doesn’t boot up until the necessary language file is ready, preventing content flickering or layout shifts caused by missing translations.

By using this approach, you ensure a smooth user experience from the moment the app loads.
