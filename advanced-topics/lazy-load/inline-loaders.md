# Inline Loaders

When working on a feature module or a library (a common practice in a monorepo environment), it's often useful to include translation files inside the module folder and package them alongside the module. To facilitate this, **Transloco** supports scopes with inline loaders. This feature allows you to specify a scope name and provide an inline loader that uses ESBuild/Webpack's `import` function to lazily load the local translation files.

For example, consider the following Angular CLI project structure:

{% tabs %}
{% tab title="Standalone" %}
📦projects\
┗ 📂feature\
┃ ┣ 📂src\
┃ ┃ ┣ 📂lib\
┃ ┃ ┃ ┣ 📂i18n\
┃ ┃ ┃ ┃ ┣ en.json\
┃ ┃ ┃ ┃ ┗ es.json\
┃ ┃ ┃ ┣ feature.component.ts\
┃ ┃ ┃ ┣ feature.routes.ts\
┃ ┃ ┃ ┗ feature.service.ts\
┃ ┃ ┣ public-api.ts\
📦src\
┣ 📂app\
┃ ┣ app.routes.ts\
┃ ┣ app.component.css\
┃ ┣ app.component.html\
┃ ┣ app.component.ts\
┃ ┣ app.config.ts\
┃ ┗ transloco.loader.ts\
┣ 📂assets\
┃ ┣ 📂i18n\
┃ ┃ ┣ en.json\
┃ ┃ ┗ es.json



Inside the feature route or component, we can define a scope provider and pass an inline loader that dynamically loads translation files:

<pre class="language-ts" data-title="feature.routes.ts"><code class="lang-ts">export const loader = ['en', 'es'].reduce((acc, lang) => {
  acc[lang] = () => import(`../i18n/${lang}.json`);
  return acc;
}, {});

export const FEATURE_ROUTES: Route = {
  path: 'feature',
  loadComponent: () =>
    import('./feature.component').then((FeatureComponent) => FeatureComponent),
  providers: [
    provideTranslocoScope({
<strong>      scope: 'scopeName',
</strong>      loader,
    }),
  ],
};
</code></pre>

{% hint style="info" %}
When using an inline loader, the `scope`'s key serves as the `alias` for the translation scope.
{% endhint %}

Now, you can translate the content using the defined `scope`:

<pre class="language-ts" data-title="feature.component.ts"><code class="lang-ts">@Component({
  selector: 'app-feature',
  template: ` 
    &#x3C;ng-container *transloco="let t">
<strong>      &#x3C;p>{{ t('scopeName.title') }}&#x3C;/p>
</strong>    &#x3C;/ng-container>`,
  imports: [TranslocoDirective],
})
export default class FeatureComponent {}
</code></pre>

{% hint style="info" %}
Note that following the Angular DI rules, it can be done either in a feature module that we lazy-loaded or at the component providers level.
{% endhint %}
{% endtab %}

{% tab title="NgModule" %}
📦projects\
┗ 📂feature-module\
┃ ┣ 📂src\
┃ ┃ ┣ 📂lib\
┃ ┃ ┃ ┣ 📂i18n\
┃ ┃ ┃ ┃ ┣ en.json\
┃ ┃ ┃ ┃ ┗ es.json\
┃ ┃ ┃ ┣ feature-module.component.ts\
┃ ┃ ┃ ┣ feature-module.module.ts\
┃ ┃ ┃ ┗ feature-module.service.ts\
┃ ┃ ┣ public-api.ts\
📦src\
┣ 📂app\
┃ ┣ app-routing.module.ts\
┃ ┣ app.component.css\
┃ ┣ app.component.html\
┃ ┣ app.component.ts\
┃ ┣ app.module.ts\
┃ ┣ transloco-root.module.ts\
┃ ┗ transloco.loader.ts\
┣ 📂assets\
┃ ┣ 📂i18n\
┃ ┃ ┣ en.json\
┃ ┃ ┗ es.json



Inside the feature module, we can define a scope provider and pass an inline loader to handle the translation files:

<pre class="language-typescript" data-title="feature.module.ts"><code class="lang-typescript">export const loader = ['en', 'es'].reduce((acc, lang) => {
  acc[lang] = () => import(`../i18n/${lang}.json`);
  return acc;
}, {});

@NgModule({
  imports: [TranslocoModule],
  providers: [
    provideTranslocoScope({
      scope: 'scopeName',
<strong>      loader,
</strong>    }),
  ],
  declarations: [YourComponent],
  exports: [YourComponent],
})
export class FeatureModule {}
</code></pre>

{% hint style="info" %}
When using an inline loader, the `scope`'s key serves as the `alias` for the translation scope.
{% endhint %}

Now, you can translate your content using the scope we defined:

<pre class="language-typescript" data-title="feature.component.ts"><code class="lang-typescript">@Component({
  selector: 'app-feature',
  template: `
    &#x3C;ng-container *transloco="let t">
<strong>      &#x3C;p>{{ t('scopeName.title') }}&#x3C;/p>
</strong>    &#x3C;/ng-container>
  `,
})
export class FeatureComponent {}
</code></pre>

This setup will lazy-load both the feature module and its translation files in your application:

{% code title="app.module.ts" %}
```typescript
@NgModule({
  declarations: [AppComponent],
  imports: [
    TranslocoRootModule,
    RouterModule.forRoot([
      {
        path: 'route-name',
        loadChildren: () =>
          import('path/to/feature/module').then((m) => m.FeatureModule),
      },
    ]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```
{% endcode %}

{% hint style="info" %}
Following Angular's Dependency Injection (DI) rules, this can be done either in the lazy-loaded feature module or at the component provider level.
{% endhint %}
{% endtab %}
{% endtabs %}

You can find a complete working example using **Nx** [here](https://github.com/NetanelBasal/transloco-with-nx-libs).

