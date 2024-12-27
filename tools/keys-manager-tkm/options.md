---
description: Configuration Options for Transloco Keys Manager
---

# Options

## CLI Options

#### **`--help -h`**

Displays the help menu for the Transloco Keys Manager.

### Extract Command

#### **`--config -c`**

Defines the root search directory for the Transloco configuration file. The default is `process.cwd()`.

#### **`--project`**

Specifies the targeted project. Defaults to `defaultProject`. The `sourceRoot` of this project, retrieved from the `angular.json` file, prefixes the default `input`, `output`, and `translationsPath` properties. Ensure full paths are provided when overriding these options. The Transloco configuration file is also searched in the project's `sourceRoot` unless the `config` option is explicitly provided.

{% hint style="info" %}
If no `angular.json` file is present, `sourceRoot` defaults to `src`.
{% endhint %}

#### **`--input -i`**

Specifies the source directory for all files using translation keys. Defaults to `[${sourceRoot}/app']`.

```bash
transloco-keys-manager extract -i src/my/path  
transloco-keys-manager extract -i src/my/path,project/another/path  
```

{% hint style="info" %}
If a project is provided, the default input value is determined by `projectType`. For libraries, the default is `['${sourceRoot}/lib']`.
{% endhint %}

#### **`--output -o`**&#x20;

Specifies the target directory for generated translation files. Defaults to `${sourceRoot}/assets/i18n`.

#### **`--fileFormat -f`**

Sets the translation file format (`json` or `pot`). Defaults to `json`.

#### **`--langs -l`**

Defines the languages for which translation files are generated. Defaults to `[en]`.

#### **`--marker -m`**

Specifies the marker sign for dynamic values. Defaults to `t`.

#### **`--sort`**

Sort the keys using JavaScript’s `sort()` method. Defaults to `false`.

#### **`--unflat -u`**

Determines whether to unflatten keys. Defaults to `flat`.

{% hint style="info" %}
When using unflattened files, "parent" keys cannot hold separate translation values. For example, if you have `first` and `first.second`, the translation file will represent this as:\
`{ "first": { "second": "…" } }`.\
During extraction, warnings will highlight keys requiring attention.
{% endhint %}

#### **`--defaultValue -d`**

Defines the default value for generated keys. Defaults to `Missing value for {{key}}`.

Supported replaceable placeholders:

* `{{key}}`: Complete key, including the scope.
* `{{keyWithoutScope}}`: Key value without the scope.
* `{{scope}}`: The key's scope.
* `{{params}}`: Parameters used for the key.

#### **`--replace -r`**&#x20;

Replaces the contents of a translation file if it already exists. Defaults to `false` (merges files instead).

#### **`--removeExtraKeys -r`**

Removes extra keys from existing translation files. Defaults to `false`.

#### **`--addMissingKeys -a`**

Adds missing keys identified by the `detective`. Defaults to `false`.

### **Find Command**

#### **`--emitErrorOnExtraKeys -e`**

It emits an error and exits the process if extra keys are found. Defaults to `false`.

{% hint style="info" %}
**Extra keys** are those present in translations but not used in the code.
{% endhint %}

#### **`--translationsPath -p`**

Defines the root directory path for translation files. Defaults to `${sourceRoot}/assets/i18n`.



## Transloco Config File

If you installed transloco via the schematics, a `transloco.config.ts` should have been created. Otherwise, you can just create a `transloco.config.ts` in the project's root folder and add the configuration in it:

```typescript
import {TranslocoGlobalConfig} from "@jsverse/transloco-utils";

const config: TranslocoGlobalConfig = {
  rootTranslationsPath?: string;
  langs?: string[];
  keysManager: {
    input?: string | string[];
    output?: string;
    fileFormat?: 'json' | 'pot';
    marker?: string;
    addMissingKeys?: boolean;
    emitErrorOnExtraKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
    unflat?: boolean;
  }
};

export default config;
```
