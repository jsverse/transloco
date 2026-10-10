---
icon: key-skeleton
---

# Keys Manager (TKM)

the process of managing translations often presents a series of challenges:

* **Repetition and Redundancy**: Adding new text requires manually creating entries in translation files, locating the appropriate placements, and ensuring consistency across languages.
* **Maintenance Overhead**: Removing obsolete keys demands vigilance to clean up translation files in all languages, which can become cumbersome as the project scales.
* **Error-Prone Processes**: Keeping track of missing or extra keys, managing dynamic keys, and organizing translations can easily lead to errors and inconsistencies.
* **Time Consumption**: Translating and maintaining localization files often distract developers from focusing on core functionalities and innovation.

To streamline these tasks, the **T**ransloco **K**eys **M**anager or **TKM** for short was developed. This toolset automates tedious processes like extracting, organizing, and validating translation keys, enabling teams to focus on delivering exceptional user experiences with less effort and fewer errors.

{% hint style="warning" %}
**Deprecated in v9:** the `transloco-keys-manager` package and its `transloco-keys-manager` bin are replaced by the [Transloco CLI](../transloco-cli.md). Run `transloco extract` instead of `transloco-keys-manager extract`, and `transloco find` instead of `transloco-keys-manager find`. The old bin keeps working until Transloco v10, see [Moving to the Transloco CLI](../../migration-guides/migrate-to-v9.md#moving-to-the-transloco-cli).

The Keys Manager moved into the main [jsverse/transloco](https://github.com/jsverse/transloco) monorepo and joined the shared version line, so it jumps straight from `8.1.1` to `9.0.0`. Its commands, options and configuration are unchanged. It requires `@angular/compiler >=20`, `typescript >=5.8` and Node.js `^22.18.0 || >=24`.
{% endhint %}

## Installation

### Schematics

Assuming you've already added Transloco to your project, run the following schematics command:

{% tabs %}
{% tab title="Angular CLI" %}
```bash
pnpm add @jsverse/transloco-schematics@next
ng g @jsverse/transloco-schematics:keys-manager
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco-schematics@next
nx g @jsverse/transloco-schematics:keys-manager
```
{% endtab %}
{% endtabs %}

The schematic installs `@jsverse/transloco-cli`, fills in the `rootTranslationsPath` and `langs` of your `transloco.config.ts` when they are missing (pass `--translation-path` and `--langs` if it asks for them), and adds these scripts to your `package.json`:

```json
"scripts": {
  "i18n:extract": "transloco extract",
  "i18n:find": "transloco find"
}
```

{% hint style="info" %}
The Keys Manager webpack plugin was removed in v9, since Angular's default builder no longer uses webpack. Run `transloco extract` before your dev server starts instead, as in `"start": "transloco extract && ng serve"`.
{% endhint %}

### Manual

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add -D @jsverse/transloco-cli@next
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add -D @jsverse/transloco-cli@next
```
{% endtab %}

{% tab title="npm" %}
```bash
npm i -D @jsverse/transloco-cli@next
```
{% endtab %}
{% endtabs %}

Add the following scripts to your `package.json` file:

```json
"scripts": {
  "i18n:extract": "transloco extract",
  "i18n:find": "transloco find"
}
```

You can also run `transloco init` to create the config, the translation files and these scripts in one step.
