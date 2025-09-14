# Scope Configuration

{% hint style="warning" %}
**Important**\
Note that scopes follow **Angular DI rules**. They only work when declared in a lazy load module, or a component's providers.
{% endhint %}

Let's say we have a "todos" page, and we want to create separate translation files for this page that load only when the user navigates there. To achieve this, we first create a `todos` folder (or any name of your choice) and place a translation file for each language we want to support:

```
├─ i18n/
   ├─ en.json
   ├─ es.json
   ├─ todos/
      ├─ en.json
      ├─ es.json
```

There are three levels of setting the translation scope:

1. **Lazy Module Providers**
2. **Component Providers**
3. **Inline Input**

#### Lazy Module Providers

You can set the translation scope inside the lazy-loaded route providers. Here's how to do it for the `todos` route:

{% code title="todos.routes.ts" %}
```ts
import { Route } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export const TODO_ROUTES: Route = {
  path: '',
  loadComponent: () =>
    import('./todos.component').then((TodosComponent) => TodosComponent),
  providers: [
    provideTranslocoScope('todos'),
    // You can also provide multiple scopes at once
    provideTranslocoScope('todos', { scope: 'shared', alias: 'sharedAlias' }),
  ],
};
```
{% endcode %}

#### Component Providers

Alternatively, you can define the translation scope directly in the component’s providers:

{% code title="todos.component.ts" %}
```ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [provideTranslocoScope('todos')],
})
export class MyComponent {}
```
{% endcode %}

#### Inline Input

You can also specify the translation scope inline using the `scope` input in the `transloco` structural directive:

<pre class="language-html" data-title="todos.component.html"><code class="lang-html"><strong>&#x3C;ng-container *transloco="let t; scope: 'todos';">
</strong>  &#x3C;h1>{{ t('todos.keyFromTodos') }}&#x3C;/h1>
&#x3C;/ng-container>
</code></pre>

#### How It Works

Each of these methods tells Transloco to load the corresponding scope based on the active language and merge it under the scope namespace into the active language translation object.

For example, if the active language is English (`en`), Transloco will load the `todos/en.json` file and set the translation as follows:

```json
{
  "header": "",
  "login": "",
  "todos": {
    "submit": "",
    "title": ""
  }
}
```

You can access these keys using the `todos` namespace:

{% code title="todos.component.html" %}
```html
<ng-container *transloco="let t">
  <h1>{{ t('todos.title') }}</h1>
</ng-container>

{{ 'todos.title' | transloco }}

<span transloco="todos.submit"></span>
```
{% endcode %}

#### Scope's Namespace

By default, the namespace will be the scope’s name in camel-case. You can preserve the original casing by configuring the `scope.keepCasing` option.

Alternatively, you can provide a custom namespace for the scope by specifying an alias name in the module or component provider:

```ts
provideTranslocoScope({ scope: 'todos', alias: 'customName' });
```

Then, you can access the translations via the `customName` alias instead of the original `todos` scope:

{% code title="todos.component.html" %}
```html
<ng-container *transloco="let t">
  <h1>{{ t('customName.title') }}</h1>
</ng-container>

{{ 'customName.title' | transloco }}

<span transloco="customName.submit"></span>
```
{% endcode %}
