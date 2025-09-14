---
icon: book-open
---

# Transloco Goes Functional: A Guide to Transloco's Functional Transpiler

![](<../../.gitbook/assets/Screenshot 2025-01-20 at 17.50.51 copy 2.png>)   Written by Shahar Kazaz, Co-Creator & maintainer of Transloco\
[<picture><source srcset="../../.gitbook/assets/Octicons-mark-github-dark.png" media="(prefers-color-scheme: dark)"><img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="" data-size="line"></picture>](https://github.com/shaharkazaz) [<picture><source srcset="../../.gitbook/assets/medium_logo_dark.png" media="(prefers-color-scheme: dark)"><img src="../../.gitbook/assets/meidum-logo.png" alt="" data-size="line"></picture>](https://medium.com/@shahar.kazaz) [<img src="../../.gitbook/assets/LinkedIn_icon_circle.svg.png" alt="" data-size="line">](https://www.linkedin.com/in/shahar-kazaz/)

<figure><picture><source srcset="../../.gitbook/assets/1_oJcxt06UXLSNyvbqNe18tA copy2.png" media="(prefers-color-scheme: dark)"><img src="../../.gitbook/assets/1_oJcxt06UXLSNyvbqNe18tA.webp" alt="" width="375"></picture><figcaption></figcaption></figure>

A friend of mine shared an exciting use-case: he needed to change translation values depending on whether the user had access to a specific feature. As the translations were scattered across the app, dynamically replacing many of them became quite a hassle.

That got me thinking about solving this problem globally — and then the idea hit me: why not allow function calls directly in the translation values?

### The Transloco Transpiler <a href="#id-16eb" id="id-16eb"></a>

The Transloco transpiler is responsible for resolving translation values. For instance, when provided with `Hello {{ key }}`, the transpiler replaces the dynamic variable `key` based on the provided parameters or, in some cases, the [translation object itself](../../additional-functionality/key-referencing.md).

### Introducing the Functional Transpiler 💫 <a href="#id-0256" id="id-0256"></a>

Now, in addition to the default transpiler, **Transloco** offers the new **FunctionalTranspiler**. This allows you to embed function calls within your translation values, enabling a new level of flexibility. You can now leverage the power of **Angular’s Dependency Injection (DI)** and make your translations even more dynamic.

The **FunctionalTranspiler** is fully compatible with the default **TranslocoTranspiler**. This means you can switch to the functional version without worrying about breaking existing translations.&#x20;

{% hint style="warning" %}
Switching back to the default transpiler will require removing any functional syntax from your translations.
{% endhint %}

### How to Enable the Functional Transpiler

{% tabs %}
{% tab title="Standalone" %}
To start using the Functional Transpiler, you need to add the following provider in your app's providers:

```typescript
import { FunctionalTranspiler, provideTransloco, provideTranslocoTranspiler } from '@jsverse/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    ...
    provideTranslocoTranspiler(FunctionalTranspiler)
  ]  
}
```
{% endtab %}

{% tab title="NgModule" %}
To start using the Functional Transpiler, you need to add the following provider in your **TranslocoRootModule**:

```typescript
import { FunctionalTranspiler, provideTranslocoTranspiler } from '@jsverse/transloco';

@NgModule({
  ...
  providers: [provideTranslocoTranspiler(FunctionalTranspiler)]
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}

### Using Functions in Translations

To use functions within your translations, you first need to define them for the transpiler. You do this by creating a class that implements the **TranslocoTranspilerFunction** interface.

For example, let’s say we want to display different text based on whether the user is allowed to access a specific feature:

```typescript
import { TranslocoTranspilerFunction } from '@jsverse/transloco';

class FeatureFlagTranspiler implements TranslocoTranspilerFunction {
  #featureFlagService = inject(FeatureFlagService);
  
  transpile(feature: string, flagEnabledText: string, flagDisabledText: string): any {
    return this.#featureFlagService.hasFF(feature) ? flagEnabledText : flagDisabledText;
  }
}
```

In this case, our **transpile** function accepts three arguments:

1. The name of the feature flag.
2. The value to show when the feature is enabled.
3. The value to show when the feature is disabled.

You can inject and use this custom transpiler function like this:

{% tabs %}
{% tab title="Standalone" %}
```typescript
import { FunctionalTranspiler, provideTransloco, provideTranslocoTranspiler } from '@jsverse/transloco';
import { FeatureFlagResolver } from './feature-flag-resolver';

export const appConfig: ApplicationConfig = {
  providers: [
    ...
    provideTranslocoTranspiler(FunctionalTranspiler),
    {
      // 👇 The function name used in the translation
      provide: 'hasFeatureFlag',
      useClass: FeatureFlagResolver
    }
  ]  
}
```
{% endtab %}

{% tab title="NgModule" %}
```typescript
import { FunctionalTranspiler, provideTranslocoTranspiler } from '@jsverse/transloco';
import { FeatureFlagResolver } from './feature-flag-resolver';

@NgModule({
  ...
  providers: [
    provideTranslocoTranspiler(FunctionalTranspiler),
    {
      // 👇 The function name used in the translation
      provide: 'hasFeatureFlag',
      useClass: FeatureFlagResolver
    }
  ]
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}

Now, to use this function in a template, you just need to call it as a regular function within your translation string:

```json
{
  "newDashboard": "[[ hasFeatureFlag('newDashboard', 'has flag', 'missing flag')]]"
}
```

In this example, the function checks whether the **newDashboard** feature flag is enabled. If it is, it will display "has flag"; otherwise, it will show "missing flag".

### Usage Notes

* If the function returns a string with interpolation syntax (e.g., `{{value}}`), the transpiler will replace it with the relevant params or references, just like the default transpiler.
* If your function’s parameter contains a comma, be sure to escape it properly (`\\,`). For example, `'Hello {{user}}\\, welcome'` will pass `"Hello {{user}}, welcome"` as the first parameter.

### Custom Transpilers

Transloco also gives you the flexibility to create your own custom transpilers. Have a cool idea for a transpiler? Implement it and share it with the community! 🤗
