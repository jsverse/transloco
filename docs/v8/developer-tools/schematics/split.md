# :split

This schematic splits a merged translation file back into individual scope translation files, based on the project's translation configuration.

---

## Command

{% tabs %}
{% tab title="Angular CLI" %}

```bash
ng generate @jsverse/transloco-schematics:split
```

{% endtab %}

{% tab title="Nx 🐋" %}

```bash
pnpm add @jsverse/transloco-schematics
nx g @jsverse/transloco-schematics:split
```

{% endtab %}
{% endtabs %}

---

### Options

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="100"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--translation-path</code></td><td><code>root</code></td><td>The folder that contains the root translation files.</td><td><code>string</code></td><td><code>src/assets/i18n</code></td></tr><tr><td><code>--source</code></td><td><code>o</code></td><td>The source directory path that contains the merged translation files.</td><td><code>string</code></td><td><code>dist-i18n</code></td></tr></tbody></table>

---

### **Usage Example**

```bash
ng generate @jsverse/transloco-schematics:split --root src/assets/i18n -o dist-i18n
```
