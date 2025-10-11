# Scope Schematic

This schematic adds a new Transloco scope to an existing or new Angular module and creates the scope's translation files.

***

## Command

{% tabs %}
{% tab title="Angular CLI" %}
```bash
pnpm add @jsverse/transloco-schematics
ng generate @jsverse/transloco-schematics:scope [name]
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco-schematics
nx g @jsverse/transloco-schematics:scope [name]
```
{% endtab %}
{% endtabs %}

### Options

<table data-header-hidden data-full-width="false"><thead><tr><th width="136"></th><th width="100"></th><th></th><th width="109"></th><th width="100"></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--name</code></td><td><code>-</code></td><td>Defines the name of the new scope.</td><td><code>string</code></td><td><code>-</code></td></tr><tr><td><code>--module</code></td><td><code>-</code></td><td>Defines the path to the module where the scope should be added. If not provided, a new module is created.</td><td><code>string</code></td><td><code>-</code></td></tr><tr><td><code>--langs</code></td><td><code>la</code></td><td>Defines the languages for the scope. Defaults to the root languages.</td><td><code>string</code></td><td>Root languages of the project</td></tr><tr><td><code>--skip-creation</code></td><td><code>-</code></td><td>Skips the creation of translation files.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--translate-type</code></td><td><code>-</code></td><td>Defines the format of the translation files.</td><td><code>string</code></td><td><code>JSON</code></td></tr><tr><td><code>--translation-path</code></td><td><code>-</code></td><td>Defines the location of the translation files.</td><td><code>string</code></td><td><code>assets/i18n/</code></td></tr></tbody></table>

### **Usage Example**

```bash
ng g @jsverse/transloco-schematics:scope my-scope
ng g @jsverse/transloco-schematics:scope my-scope --module path/to/my-scope
ng g @jsverse/transloco-schematics:scope my-scope --langs en,fr --skip-creation
```
