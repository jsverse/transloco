# Key Referencing

You can reference specific keys within other keys in the same translation file. This feature allows for dynamic translations, where one key can depend on another.

**Example:**

{% code title="en.json" %}
```json
{
  "alert": "alert {{value}} english",
  "home": "home english",
  "fromList": "from {{home}}"
}
```
{% endcode %}

In this case, calling `service.translate('fromList')` will return:\
&#xNAN;**"from home english"**.

***

### Key Referencing Within Scopes

When using key references inside a scope, be sure to prefix the referenced key with the scope name.

**Example:**

{% code title="admin/en.json" %}
```json
{
  "alert": "alert {{value}} english",
  "home": "home english",
  "fromList": "from {{admin.home}}"
}
```
{% endcode %}

Here, calling `service.translate('admin.fromList')` will return:\
&#xNAN;**"from home english"**.

***

### Passing Parameters to Reused Keys

You can also pass parameters to the reused key. This allows you to dynamically insert values into the translation.

**Example:**

{% code title="en.json" %}
```json
{
  "hello": "Hello {{name}},",
  "greet": "{{hello}}, have a good day!"
}
```
{% endcode %}

In this case, calling `service.translate('greet', {name: 'John'})` will return:\
&#xNAN;**"Hello John, have a good day!"**.

***

### Avoid Circular References

Be cautious when creating key references that may result in circular references. This can lead to infinite loops and unexpected behavior.

**Example:**

{% code title="en.json" %}
```json
{
  "key": "{{key2}}",
  "key2": "{{key}}"
}
```
{% endcode %}

This will create a circular reference, which should be avoided.
