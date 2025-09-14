---
icon: spinner-scale
---

# Loading Template

Transloco allows you to define a loading template that will be used while the translation file is being loaded.

You can use the `provideTranslocoLoadingTpl` function in lazy module providers, component providers, in the template, or even in the `AppModule`/`app.config.ts` to apply it globally across the app.

### Using `provideTranslocoLoadingTpl` in a component

{% code title="my-comp.component.ts" %}
```typescript
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [provideTranslocoLoadingTpl('<p>Loading...</p>')],
})
export class MyComponent {}
```
{% endcode %}

This accepts raw HTML or a custom Angular component.

### Using it directly in the template:

{% code title="my-comp.component.html" %}
```html
<ng-container *transloco="let t; loadingTpl: loading">
  <h1>{{ t('title') }}</h1>
</ng-container>

<ng-template #loading>
  <h1>Loading...</h1>
</ng-template>
```
{% endcode %}

This allows you to display a loading template while the translations are being fetched.
