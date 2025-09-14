# Using with Nx 🐋

To use TKM in an Nx workspace, we are going to leverage the `--project` flag to dynamically set the base paths for `rootTranslationsPath`, `input`, and `output`, ensuring the correct translation files are handled for the specified project.

{% hint style="info" %}
Make sure you don't have these properties set on your `transloco.config.ts`
{% endhint %}

### Defining an Nx Workspace Task

To integrate Transloco commands with an Nx workspace, you can define tasks in the `project.json` file of each application or library where you want Transloco to extract or find keys. Below is an example setup:

```json
{
  "i18n-extract": {
    "command": "transloco-keys-manager extract --project projectName"
  },
  "i18n-find": {
    "command": "transloco-keys-manager find --project projectName"
  }
}
```

* **`i18n-extract`**: Extracts translation keys from the specified project.
* **`i18n-find`**: Identifies missing keys or extra keys in the specified project.

Replace `projectName` with the project's name as defined in your `angular.json` or Nx workspace configuration.

{% hint style="warning" %}
Don't pass the `cwd` option to these nx commands as it will affect the root path to look for the "prettier" config file used by the keys manager.
{% endhint %}

\
