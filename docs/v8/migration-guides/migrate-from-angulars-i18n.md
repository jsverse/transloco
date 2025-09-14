---
icon: a
---

# Migrate from Angular's i18n

## Command

{% tabs %}
{% tab title="Angular CLI" %}

```bash
ng g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}

{% tab title="Nx 🐋" %}

```bash
pnpm add @jsverse/transloco-schematics
nx g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
When running the migration schematic, you'll be prompted to select which library you're migrating from. Choose "Angular i18n" from the options.
{% endhint %}

---

### The Translation File

The migration script will extract all translations from your HTML files and generate a translations JSON file. The script will use the translation string as the key, converting it to kebab case (e.g., "`My sample string`" → "`my-sample-string`"). Here's an example of the output JSON:

{% code title="en.json" %}

```json
{
  "my-sample-string": "My sample string",
  "my-title": "My title"
}
```

{% endcode %}

#### **Example HTML section and matching JSON output**

{% code title="before.html" %}

```html
<h1 i18n>translation value</h1>
<h1 i18n="site header|value 1 sample">Val1</h1>
<h1 i18n="site header|value 2 sample">Val2</h1>
<h1 i18n="other context|another comment@@myId">Val3</h1>
```

{% endcode %}

{% code title="after.json" %}

```json
{
  "translation-value": "translation value",
  "site header": {
    "val1": "Val1",
    "val1.comment": "value 1 sample",
    "val2": "Val2",
    "val2.comment": "value 2 sample"
  },
  "other context": {
    "myId": "Val3",
    "myId.comment": "another comment"
  }
}
```

{% endcode %}

{% hint style="info" %}
&#x20;_The `.comment` suffix is used to support comments in Transloco.Note:_
{% endhint %}

---

### Directives

The `i18n` and `i18n-<attribute>` directives will be replaced with the `transloco` pipe.

{% code title="before.html" %}

```html
<h1 i18n>Hello World</h1>
<h1 i18n="other context|another comment@@myId">Some value</h1>
<img src="..." i18n i18n-title="Wow image" />
```

{% endcode %}

{% code title="after.html" %}

```html
<h1>{{ 'hello-world' | transloco }}</h1>
<h1>{{ 'some-value' | transloco }}</h1>
<img src="..." title="{{ 'wow-image' | transloco }}" />
```

{% endcode %}
