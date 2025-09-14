---
icon: floppy-disk
---

# Preload Languages

This plugin enables the preloading of specified languages during periods of browser inactivity, leveraging the `requestIdleCallback` API for optimal performance.

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-preload-langs
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-preload-langs
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-preload-langs
```
{% endtab %}
{% endtabs %}

## Usage

{% tabs %}
{% tab title="Standalone" %}
```typescript
import { provideTranslocoPreloadLangs } from '@jsverse/transloco-preload-langs';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoPreloadLangs(['es', 'some-scope'])
  ],
});
```


{% endtab %}

{% tab title="NgModule" %}
```typescript
import { provideTranslocoPreloadLangs } from '@jsverse/transloco-preload-langs';

@NgModule({
  providers: [
    provideTranslocoPreloadLangs(['es', 'some-scope'])
  ]
  ...
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}
