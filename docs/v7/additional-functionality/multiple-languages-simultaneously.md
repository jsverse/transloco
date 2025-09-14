# Multiple Languages Simultaneously

There are scenarios where you may need to use a different language within a specific part of your application, such as a component, module, or a template section. This can be achieved using the `provideTranslocoLang` function.

***

#### **Setting Language in a Component's Providers**

You can set a specific language for a component and its children by adding `provideTranslocoLang` to the `providers` array of the component:

```typescript
my-comp.component.ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [provideTranslocoLang('es')],
})
export class MyComponent {}
```

Using Angular's Dependency Injection (DI) rules, ensures that the `es` language is applied in this component's template and all of its child components.

***

#### **Specifying Language Directly in a Template**

You can also set the language inline within a template using the `*transloco` structural directive:

```html
my-comp.component.html
<ng-container *transloco="let t; lang: 'en'">
  <p>Inline (en) wins: {{ t('home') }}</p>
</ng-container>
```

In this example, the language for this part of the template is explicitly set to `en`.

***

### **Using a Static Language**

If you need the language to remain static (i.e., not change dynamically), you can append `|static` to the language definition.

#### Setting in a Component:

```typescript
my-comp.component.ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [provideTranslocoLang('es|static')],
})
export class MyComponent {}
```

#### Setting Directly in a Template:

You can dynamically define the language or pass it as a static value:

```html
my-comp.component.html
<!-- Define the language dynamically from the component -->
<ng-container *transloco="let t; lang: someVariable">
  <p>Dynamically set language: {{ t('home') }}</p>
</ng-container>

<!-- Or pass it as a static inline string -->
<ng-container *transloco="let t; lang: 'es|static'">
  <p>Inline (es) wins and stays: {{ t('home') }}</p>
</ng-container>
```

***

This approach provides flexibility to localize specific parts of your application based on the context while maintaining the desired level of language control.
