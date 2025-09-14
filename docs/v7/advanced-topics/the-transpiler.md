---
description: A deep dive into one of Transloco's main components, the transpiler.
---

# The Transpiler

toThe transpiler is responsible for resolving dynamic values in translations. For example, when given `Hello {{ key }}`, the default transpiler will replace the dynamic variable `key` with the corresponding value from the provided parameters or the translation object.

## DefaultTranspiler

The default transpiler can be customized with different interpolation start and end markers to match your message parameters.

To configure the `DefaultTranspiler`'s interpolation markers, you need to provide a `Transloco` configuration with the [`interpolation`](../readme/config-options.md#interpolation) property set.

## Functional Transpiler

In addition to the default transpiler, Transloco also offers the `FunctionalTranspiler`, which allows you to integrate function calls into your translation values. This makes your translations more dynamic by leveraging Angular's Dependency Injection system.

The `FunctionalTranspiler` is compatible with the `DefaultTranspiler`, meaning you can switch between them without breaking existing translations.

{% hint style="warning" %}
Switching back to the default transpiler will require removing any functional syntax from your translations.
{% endhint %}

### Usage

To use a function in a translation, you need to provide it to the transpiler by creating a class that implements the `TranslocoTranspilerFunction` interface.

For example, let’s say you want to display different texts based on whether the user has access to a specific feature:

{% code title="has-feature-flag.ts" %}
```ts
import { FFService } from './feature-flag.service';
import { TranslocoTranspilerFunction } from '@jsverse/transloco';

class FeatureFlagResolver implements TranslocoTranspilerFunction {
  constructor(private featureFlagService: FFService) {}

  transpile(...args: string[]): any {
    const [flagName, trueValue, falseValue] = args;
    
    return this.featureFlagService.hasFF(flagName) ? trueValue : falseValue;
  }
}
```
{% endcode %}

In this case, the `transpile` function accepts three arguments:

1. The feature flag's name.
2. The value to display if the user has the flag.
3. The value to display if the user does not have the flag.

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

Add the transpiler function to the providers array:

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
To enable the `FunctionalTranspiler`, add the following provider in your `TranslocoRootModule`:

{% code title="transloco-root.module.ts" overflow="wrap" %}
```ts
import { FunctionalTranspiler, provideTranslocoTranspiler } from '@jsverse/transloco';

@NgModule({
  ...
  providers: [provideTranslocoTranspiler(FunctionalTranspiler)]
})
export class TranslocoRootModule {}
```
{% endcode %}

Add the transpiler function to the `TranslocoRootModule` providers:

{% code title="transloco-root.module.ts" %}
```ts
import { FunctionalTranspiler, provideTranslocoTranspiler } from '@jsverse/transloco';
import { FeatureFlagResolver } from './has-feature-flag';

@NgModule({
  ...
  providers: [
    provideTranslocoTranspiler(FunctionalTranspiler),
    {
      provide: 'hasFeatureFlag', // ====> The function name used in the translation
      useClass: FeatureFlagResolver
    }
  ],
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

Now, you can use the function in your translation files with the functional syntax:

{% code title="en.json" %}
```json
{
  "title": "[[ hasFeatureFlag(newDashboards, has flag, missing flag) ]]"
}
```
{% endcode %}

In this case, the translation checks if the user has the `newDashboards` feature flag. If they do, it displays "has flag"; otherwise, it displays "missing flag".

### Usage Notes

* If the function returns a string that contains interpolation syntax (e.g., `{{ value }}`), the transpiler will replace it with the appropriate params or key references, just like the default transpiler.
* If your function parameters need to include a comma, escape it using `\\,`:

{% code title="en.json" %}
```json
{
  "title": "[[ someFunc(Hello {{user}}\\, welcome ,...) ]]"
}
```
{% endcode %}

In this case, `"Hello {{user}}, welcome"` will be the first parameter passed to the function.

## Custom Transpiler

You can also provide a custom transpiler by creating a class that implements the `TranslocoTranspiler` interface:

```ts
import { TranslocoTranspiler } from '@jsverse/transloco';

export class CustomTranspiler implements TranslocoTranspiler {
  transpile(value: any, params, translation: Translation, key: string) {
    return ...;
  }
}
```
