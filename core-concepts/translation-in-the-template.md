# Translation in the Template

### Structural Directive

The **structural directive** is the recommended approach as it is DRY (Don't Repeat Yourself) and efficient. It creates a single subscription per template, making it an optimal choice for translations:

```html
<ng-container *transloco="let t">
  <p>{{ t('title') }}</p>
  <comp [title]="t('title')"></comp>
</ng-container>
```

The `t` function is memoized, meaning it caches translation results. If the same key is requested again, it will return the cached value for better performance.

You can also pass a **params object** as the second argument:

{% code title="home.component.html" %}
```html
<ng-container *transloco="let t">
  <p>{{ t('name', { name: 'Transloco' }) }}</p>
</ng-container>
```
{% endcode %}

And here is how that translation looks like:

{% code title="en.json" %}
```json
{
  "name": "My name is {{name}}"
}
```
{% endcode %}

To translate based on a **different** language, specify the `lang` input:

<pre class="language-html" data-title="home.component.html"><code class="lang-html"><strong>&#x3C;ng-container *transloco="let t; lang: 'es'">
</strong>  &#x3C;p>{{ t('title') }}&#x3C;/p>
&#x3C;/ng-container>
</code></pre>

This will use the Spanish translation file to translate the keys.

**Using the `prefix` Input**

{% hint style="warning" %}
The `read` input was renamed to `prefix` starting with v7.1.0. The old `read` input is now deprecated and will be removed in v8.
{% endhint %}

You can use the `prefix` input in the structural directive to get translations for nested properties (including deeply nested ones). This eliminates the need to repeatedly specify the same parent key in your translations.

Let's look at the following JSON file:

{% code title="en.json" %}
```json
{
  "foo": "Foo",
  "bar": "Bar",
  "dashboard": {
    "title": "Dashboard Title",
    "desc": "Dashboard Description"
  }
}
```
{% endcode %}

And here's how we use the `prefix` in the template:

<pre class="language-html"><code class="lang-html"><strong>&#x3C;ng-container *transloco="let t; prefix: 'dashboard'">
</strong>  &#x3C;p>{{ t('title') }}&#x3C;/p>
  &#x3C;p>{{ t('desc') }}&#x3C;/p>
&#x3C;/ng-container>
</code></pre>

When you pass a prefix, Transloco treats the keys as if you had written them like this:

```html
<ng-container *transloco="let t;">
  <h1>{{ t('dashboard.title') }}</h1>
  <p>{{ t('dashboard.desc') }}</p>
</ng-container>
```

### Pipe

Another option is using the **transloco pipe**:

```html
<span>{{ 'home' | transloco }}</span>
```

You can use it with **params**:

```html
<span>{{ 'alert' | transloco: { value: dynamic } }}</span>
```

It can also be used with **bindings** or **inputs**:

```html
<span [attr.alt]="'hello' | transloco">Attribute</span>
<span [title]="'hello' | transloco">Property</span>
<my-comp [label]="'hello' | transloco" />
```

To translate using a **different language**:

```html
<span>{{ 'alert' | transloco:params:'es' }}</span>
```

### Attribute Directive

Finally, you can use the **transloco attribute directive**:

```html
<span transloco="home"></span>
```

Use it with **params**:

```html
<span transloco="alert" [translocoParams]="{ value: dynamic }"></span>
```

To specify a **different language**:

```html
<span transloco="home" translocoLang="es"></span>
```
