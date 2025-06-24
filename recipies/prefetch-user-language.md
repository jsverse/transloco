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
import { lastValueFrom } from 'rxjs';

export function preloadUser() {
  const userService = inject(UserService);
  const transloco = inject(TranslocoService);
  return async () => {
    const config = await userService.getUser();
    // Set the language
    transloco.setActiveLang(config.lang);
    // Load the translation file - load returns an observable
    await lastValueFrom(transloco.load(config.lang));
  };
}

export function providePreloadUserLang() {
  return provideAppInitializer(preloadUser);
}
```
{% endcode %}
{% endtab %}

{% tab title="Angualr <19" %}
```typescript
import { APP_INITIALIZER } from '@angular/core';
import { UserService } from './user.service';
import { TranslocoService } from '@jsverse/transloco';
import { lastValueFrom } from 'rxjs';

export function preloadUser(userService: UserService, transloco: TranslocoService) {
  return async function() {
     const config = await userService.getUser();
     // Set the language
     transloco.setActiveLang(config.lang);
     // Load the translation file - load returns an observable
     await lastValueFrom(transloco.load(config.lang));
    };
  };
}

export function providePreloadUserLang() {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: preloadUser,
    deps: [UserService, TranslocoService]
  };
}
```
{% endtab %}
{% endtabs %}

#### Explanation:

* The `preloadUser` function ensures that the user's language settings are fetched from the server, and the corresponding translation file is loaded before the application starts.
* This guarantees that the app doesn’t boot up until the necessary language file is ready, preventing content flickering or layout shifts caused by missing translations.

Now all that's left is adding it as a provider to our application:

{% tabs %}
{% tab title="Standalone" %}
{% code title="app.config.ts" overflow="wrap" %}
```typescript
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';

import { TranslocoHttpLoader } from './transloco-loader';
import { providePreloadUserLang } from './preload-user-lang';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({ ... }),
    providePreloadUserLang() // 👈
  ],
};
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
```typescript
import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { Injectable, isDevMode, NgModule } from '@angular/core';

import { TranslocoHttpLoader } from './transloco-loader';
import { providePreloadUserLang } from './preload-user-lang';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({ ... }),
    providePreloadUserLang() // 👈
  ],
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}

By using this approach, you ensure a smooth user experience from the moment the app loads.
