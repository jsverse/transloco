---
description: Configuration Options for Transloco Keys Manager
---

# Options

## CLI Options

#### **`--help -h`**

Displays the help menu for the Transloco Keys Manager.

### Extract Command

#### **`--config -c`**

Names the Transloco configuration file to read, or a folder to search for one. The path has to exist, otherwise the command fails. Without it the configuration is looked up in the source root of the project, then in each parent directory up to the working directory, see [Config file](../transloco-cli.md#config-file).

#### **`--project`**

Specifies the targeted project. Defaults to `defaultProject`. The `sourceRoot` of this project, retrieved from the `angular.json` file, prefixes the default `input`, `output`, and `translationsPath` properties. Ensure full paths are provided when overriding these options. The Transloco configuration file is also searched in the project's `sourceRoot` unless the `config` option is explicitly provided.

{% hint style="info" %}
If no `angular.json` file is present, `sourceRoot` defaults to `src`.
{% endhint %}

#### **`--input -i`**

Specifies the source directory for all files using translation keys. Defaults to `[${sourceRoot}/app']`.

```bash
transloco extract -i src/my/path  
transloco extract -i src/my/path,project/another/path  
```

{% hint style="info" %}
If a project is provided, the default input value is determined by `projectType`. For libraries, the default is `['${sourceRoot}/lib']`.
{% endhint %}

#### **`--output -o`**&#x20;

Specifies the target directory for generated translation files. Defaults to `${sourceRoot}/assets/i18n`.

#### **`--file-format -f`**

Sets the translation file format (`json` or `pot`). Defaults to `json`.

#### **`--langs -l`**

Defines the languages for which translation files are generated, as separate arguments: `--langs en es`. A comma inside a value (`--langs en,es`) is rejected. Defaults to `[en]`.

#### **`--marker -m`**

Specifies the marker sign for dynamic values. Defaults to `t`.

#### **`--sort -s`**

Sort the keys using JavaScript’s `sort()` method. Defaults to `false`.

#### **`--unflat -u`**

Determines whether to unflatten keys. Defaults to `flat`.

{% hint style="info" %}
When using unflattened files, "parent" keys cannot hold separate translation values. For example, if you have `first` and `first.second`, the translation file will represent this as:\
`{ "first": { "second": "…" } }`.\
During extraction, warnings will highlight keys requiring attention.
{% endhint %}

#### **`--default-value -d`**

Defines the default value for generated keys. Defaults to `Missing value for '<key>'`.

Supported replaceable placeholders:

* `{{key}}`: Complete key, including the scope.
* `{{keyWithoutScope}}`: Key value without the scope.
* `{{scope}}`: The key's scope.
* `{{params}}`: Parameters used for the key.

#### **`--replace -r`**&#x20;

Replaces the contents of a translation file if it already exists. Defaults to `false` (merges files instead).

#### **`--remove-extra-keys -R`**&#x20;

Removes extra keys from existing translation files. Defaults to `false`.

### **Find Command**

The `find` command also takes `--project`, `--config`, `--input`, `--file-format`, `--marker`, `--sort`, `--unflat` and `--default-value`, which work as they do for `extract`.

#### **`--add-missing-keys -a`**

Adds missing keys identified by the `detective`. Defaults to `false`.

#### **`--emit-error-on-extra-keys -e`**

It emits an error and exits the process with code `2` if extra keys are found. Defaults to `false`.

{% hint style="info" %}
**Extra keys** are those present in translations but not used in the code.
{% endhint %}

#### **`--translations-path -p`**

Defines the root directory path for translation files. Defaults to `rootTranslationsPath` of the config, then to `${sourceRoot}/assets/i18n`.

{% hint style="info" %}
The `transloco` command rejects an option it doesn't read, so `--add-missing-keys`, `--emit-error-on-extra-keys` and `--translations-path` only work with `find`. See [Strict arguments](../transloco-cli.md#strict-arguments).
{% endhint %}
