# 📦 Migration Guides

Transloco offers a streamlined migration path for developers transitioning from other internationalization (i18n) libraries, such as `ngx-translate` or Angular's built-in i18n. This process is designed to minimize manual adjustments and facilitate a smooth switch to Transloco's robust features.

Just run the migration schematics and select the library you are migrating from:

{% tabs %}
{% tab title="Angular CLI" %}

```bash
ng g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}

{% tab title="Nx 🐋" %}

```bash
nx g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}
{% endtabs %}

You can find detailed information about what the migration will perform on the "[Migrate from ngx-translate](migrate-from-ngx-translate.md)" and "[Migrate from Angular's i18n](migrate-from-angulars-i18n.md)" pages.

If you encounter any issues with the migration script, please open a [GitHub issue](https://github.com/jsverse/transloco/issues), and we’ll work on resolving it to improve the migration experience for everyone.

{% hint style="warning" %}
Ensure you review the changes made by the migration script, as manual adjustments may occasionally be necessary
{% endhint %}
