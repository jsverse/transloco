---
description: Help the translator with a description and meaning
---

# Comments for Translators

Sometimes, it's important to provide the translator with additional context or a description to ensure the translation is accurate. We can include a companion key for each translation key that requires extra information to achieve this.&#x20;

This companion key is post-fixed with `.comment`, as shown in the example below:

{% code title="en.json" %}
```json
{
  "hello": "",
  "hello.comment": "Write a comment for the translator"
}
```
{% endcode %}

These comment keys are not meant to be included in the final bundle, so we can use the [`transloco-optimize`](../tools/optimize.md) library to remove them when building for production.

The library automatically removes these comment keys from the translation files specified in the given path, ensuring that only the necessary translation data is included in the final output.
