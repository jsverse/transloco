---
icon: list-check
---

# Validator

{% hint style="warning" %}
**Deprecated in v9:** the `@jsverse/transloco-validator` package and its `transloco-validator` bin are replaced by `transloco validate` of the [Transloco CLI](transloco-cli.md#validate). The old bin keeps working until Transloco v10, see [Moving to the Transloco CLI](../migration-guides/migrate-to-v9.md#moving-to-the-transloco-cli).
{% endhint %}

The **Transloco Validator** helps ensure the integrity of your translation files by validating their JSON structure and detecting duplicate keys. This tool is handy for maintaining consistent and error-free translation files throughout your project.

## **Installation**

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-cli@next --save-dev
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-cli@next --dev
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-cli@next --save-dev
```
{% endtab %}
{% endtabs %}

## **Usage**

{% tabs %}
{% tab title="lintstaged" %}
To ensure your translation files are always valid, configure Transloco Validator to run on specific paths during pre-commit checks. You can easily set this up in your `lint-staged` configuration.

`lint-staged` supports [multiple configuration formats](https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration). All you need to do is add the following line to the configuration of your choice:

```json
"src/assets/i18n/*.json": ["transloco validate"]
```

This ensures that any changes to your translation files are validated before they are committed.

{% hint style="info" %}
`ng update` doesn't edit `lint-staged` configurations. If yours still runs `transloco-validator`, change it to `transloco validate` by hand.
{% endhint %}
{% endtab %}

{% tab title="GitHub Actions" %}
Here’s an example workflow that triggers when your translation files are changed and verifies them using `transloco validate`:

{% code title="validate-translations.yml" %}
```yaml
name: Validate Translation Files

on:
  pull_request:
    paths:
      # Trigger when any i18n JSON file is modified
      - 'src/assets/i18n/**.json'

jobs:
  validate-translations:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Dependencies
        run: npm ci

      - name: Run Transloco Validator on Changed i18n Files
        run: |
          # Find the changed i18n files and run the validator on them
          git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'src/assets/i18n/.*\.json' | xargs npx transloco validate
```
{% endcode %}
{% endtab %}
{% endtabs %}

## **Benefits**

* **JSON Validation:** Verifies that all translation files have a valid JSON structure.
* **Duplicate Key Detection:** Ensures no duplicate keys are present in your translation files.

`transloco validate` checks every file it is given and prints one line per invalid file, then exits with code `1` if there was any.

By incorporating the validator into your workflow, you can maintain high-quality translation files and avoid runtime issues caused by invalid JSON or key conflicts.
