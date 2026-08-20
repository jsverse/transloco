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

{% hint style="info" %}
**New in v9:** the Keys Manager moved into the main [jsverse/transloco](https://github.com/jsverse/transloco) monorepo and joined the shared version line, so it jumps straight from `8.1.1` to `9.0.0`. Its CLI and configuration are unchanged.

It now requires `@angular/compiler >=20`, `typescript >=5.8` and Node.js `>=22`.
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

At this point, you'll have to choose whether you want to use the CLI, Webpack Plugin, or both. The project will be updated according to your choice.

{% hint style="info" %}
If you're going to use the Webpack plugin, and you've already defined other Webpack plugins in your project, you should manually add the Keys Manager plugin to the list, rather than using the schematics command.
{% endhint %}

### Manual

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add -D @jsverse/transloco-keys-manager@next
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add -D @jsverse/transloco-keys-manager@next
```
{% endtab %}

{% tab title="npm" %}
```bash
npm i -D @jsverse/transloco-keys-manager@next
```
{% endtab %}
{% endtabs %}

Add the following scripts to your `package.json` file:

```json
"scripts": {
  "i18n:extract": "transloco-keys-manager extract",
  "i18n:find": "transloco-keys-manager find"
}
```
