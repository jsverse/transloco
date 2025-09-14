# Keys Extractor

The Keys Extractor is a core feature of Transloco Keys Manager designed to identify all the translation keys in your project and generate corresponding entries in your translation files. It helps streamline the translation workflow by automating tedious tasks and ensuring consistency across the codebase.

## **CLI Usage**

To use the Keys Extractor via CLI:

{% stepper %}
{% step %}
Add a script to your `package.json`:

```json
"scripts": {
  "extract": "transloco-keys-manager extract"
}
```
{% endstep %}

{% step %}
Run the extractor:

```bash
pnpm extract
```
{% endstep %}
{% endstepper %}

This command scans your project for translation keys and updates your translation files accordingly.

### **Scopes Support**

The extractor supports [scopes](../../advanced-topics/lazy-load/scope-configuration.md) out of the box. When you define a new scope in the `providers` array:

```typescript
import { TRANSLOCO_SCOPE, provideTranslocoScope } from '@jsverse/transloco';

@Component({
  templateUrl: './admin-page.component.html',
  providers: [
      { provide: TRANSLOCO_SCOPE, useValue: 'admin' },
      provideTranslocoScope('todo'),
      provideTranslocoScope(['another', {scope: 'reallyLong', alias: 'rl'}]),
  ]
})
export class AdminPageComponent {}
```

```html
<ng-container *transloco="let t">{{ t('admin.title') }}</ng-container>
```

It'll extract the scope (`admin` in our case) keys into the relevant folder:

```
📦 assets
 ┗ 📂 i18n
 ┃ ┣ 📂 admin
 ┃ ┃ ┣ en.json
 ┃ ┃ ┗ es.json
 ┃ ┣ en.json
 ┃ ┗ es.json
```

### **Inline Loaders**

Let's say that we're using the following [inline](../../advanced-topics/lazy-load/inline-loaders.md) loader:

```typescript
export const loader = ['en', 'es'].reduce((acc, lang) => {
  acc[lang] = () => import(`../i18n/${lang}.json`);
  return acc;
}, {});

@NgModule({
  imports: [TranslocoModule],
  providers: [
    provideTranslocoScope({
      scope: 'scopeName',
      loader
    })
  ],
  declarations: [YourComponent],
  exports: [YourComponent]
})
export class FeatureModule {}
```

We can add it to the `scopePathMap` key in the [`transloco.config.ts`](../../readme/installation.md#transloco-global-config) file:

```typescript
const config: TranslocoGlobalConfig = {
  langs: ['en', 'es'],
  scopePathMap: {
    scopeName: 'src/app/feature/i18n'
  }
};

export default config;
```

Now, it'll create the files in the provided folder.

### **Dynamic Keys**

There are times when we need to extract keys with values that may change during runtime. One example can be when you need to use a dynamic expression:

```typescript
import { TranslocoService } from '@jsverse`/transloco';

class MyComponent {
  someMethod() {
    const value = translocoService.translate(`key.${type}.postfix`);
  }
}
```

To support such cases, you can add a special comment to your code, which tells the CLI to extract it. It can be added to Typescript files:

```typescript
import { TranslocoService } from '@jsverse/transloco';

class MyComponent {
  /**
   * t(key.typeOne.postfix, key.typeTwo.postfix)
   * t(this.will.be.extracted)
   */
  someMethod() {
    const value = translocoService.translate(`key.${type}.postfix`);
  }
}
```

Or to templates:

```html
<!-- t(I.am.going.to.extract.it, this.is.cool) -->
<ng-container *transloco="let t">...</ng-container>
```

When using comments in the templates they will also **inherit the `prefix` input value** (if exists), and will be prefixed with it:

```typescript
<!-- t(this.is.cool) -->
<ng-container *transloco="let m; prefix: 'messages'">
  ...
  <!-- t(success, error) -->
  <ng-container *transloco="let g; prefix: 'general'">
    ...
    <!-- t(ok, cancel) -->
  </ng-container>
</ng-container>
```

The extracted keys for the code above will be:

```json
{
  "this.is.cool": "",
  "messages.success": "",
  "messages.error": "",
  "general.ok": "",
  "general.cancel": ""
}
```

{% hint style="info" %}
1. When using a Typescript file, you must have `@jsverse/transloco` present somewhere in the file, if it's an import or simply adding a comment `// @jsverse/transloco`.
2. When using comments in your HTML files, they _must_ contain only the markers without additional text. Here's an example for invalid comment: `<!-- For dropdown t(dynamic.1, dynamic.2) -->`
{% endhint %}

### **Marker Function**

If you want to extract some standalone strings that are not part of any translation call (via the template or service) you can wrap them with the marker function to tell the keys manager to extract them:

```typescript
import { marker } from '@jsverse/transloco-keys-manager';

class MyClass {
  static titles = {
    username: marker('auth.username'), // ==> 'auth.username'
    password: marker('auth.password') // ==> 'auth.password'
  };
...
}
```

The marker function will return the string which was passed to it. You can alias the marker function if needed:

```typescript
import { marker as _ } from '@jsverse/transloco-keys-manager';

class MyClass {
  static titles = {
    username: _('auth.username'),
    password: _('auth.password')
  };
...
}
```

### **Extra Support**

#### The `prefix` input:

```html
<ng-container *transloco="let t; prefix: 'dashboard'">
  <h1>{{ t('title') }}</h1>

  <p>{{ t('desc') }}</p>
</ng-container>
```

The extracted keys for the code above will be:

```json
{
  "dashboard.title": "",
  "dashboard.desc": ""
}
```

#### **Static** ternary operators

```html
<!-- Supported by the transloco pipe and structural directive -->
<comp [placeholder]="condition ? 'keyOne' : 'keyTwo' | transloco"></comp>
<h1>{{ condition ? 'keyOne' : 'keyTwo' | transloco }}</h1>

<comp *transloco="let t; prefix: 'ternary'">
  <h1>{{ t(condition ? 'keyOne' : 'keyTwo') }}</h1>
</comp>
```

#### Supports params:

```html
<comp *transloco="let t;">
  <h1>{{ t('key', {value: '123', another: property}) }}</h1>
  <p>{{ 'description' | transloco:{'param': 123} }}</p>
  <footer transloco="footer" [translocoParams]="{param: 123}"></footer>
</comp>
```

```typescript
import {translate} from '@jsverse/transloco';

translate('key', { param: 123 });

class MyComponent {
  someMethod() {
    const value = translocoService.translate(`key`, {param: 123});
    const value$ = translocoService.selectTranslate(`key`, {param: 123});
    // Only literal params are supported, the following won't be extracted:   
    translocoService.translate(`key`, this.myParams);
  }
}
```
