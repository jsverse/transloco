# :join

This schematic merges all your translation files into a single file for each language.

***

## Command

{% tabs %}
{% tab title="Angular CLI" %}
```bash
ng generate @jsverse/transloco-schematics:join
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco-schematics
nx g @jsverse/transloco-schematics:join
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
If you have more than one entry folder for your translation files, you will need to add a mapping for each folder entry and the corresponding scope name using the `scopePathMap` property in your global config file.
{% endhint %}

By default, the build script will traverse the root translation file directory and treat every subdirectory as a scope.

For example, if your translation folder structure is:

```
├ 📂 src/assets/i18n/
   ├─ en.json
   ├─ fr.json
   ├─ es.json
   ├ 📂 todos/
      ├─ en.json
      ├─ fr.json
      ├─ es.json
```

The script will iterate all the files (excluding the default language) and merge the scope files into the main translation files.

Assuming the default language is English, running the script will produce the following outputs:

```json
// dist-i18n/es.json
{
  "hello": "transloco es",
  "todos": {
    "todos-translation": "todos es"
  }
}

// dist-i18n/fr.json
{
  "hello": "transloco fr",
  "todos": {
    "todos-translation": "todos fr"
  }
}
```

If you have multiple entry folders for a scope, you can specify the map between the scope name and the translation path using `scopePathMap` in your global config file.

#### Example (`transloco.config.ts`)

```ts
const config: TranslocoGlobalConfig = {
  scopePathMap: {
    "my-scope": "src/app/path-to-scope",
    "my-project-scope": "projects/my-project/i18n"
  }
}
```

Once you specify the `scopePathMap`, the script will automatically use it.

***

### Options

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th width="120"></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--translation-path</code></td><td><code>root</code></td><td>The folder that contains the root translation files.</td><td><code>string</code></td><td><code>src/assets/i18n</code></td></tr><tr><td><code>--out-dir</code></td><td><code>o</code></td><td>The output directory path where the merged translation files will be saved.</td><td><code>string</code></td><td><code>dist-i18n</code></td></tr><tr><td><code>--default-lang</code></td><td><code>-</code></td><td>The default language of the project.</td><td><code>string</code></td><td><code>-</code></td></tr><tr><td><code>--include-defaultLang</code></td><td><code>-</code></td><td>Determines whether to join the default language file as well.</td><td><code>boolean</code></td><td><code>false</code></td></tr></tbody></table>

***

### **Usage Example**

```bash
ng g @jsverse/transloco:join --default-lang en
ng g @jsverse/transloco:join --translation-path src/i18n --out-dir dist/i18n
```
