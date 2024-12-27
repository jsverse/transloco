# SSR Support

Create a new CLI project and add SSR support:

```bash
ng add @nguniversal/express-engine --clientProject <PROJECT-NAME>
```

When employing Angular SSR, we need to change our loader base path to be absolute instead of relative, in order for it to work. Run `ng add @jsverse/transloco` and choose the SSR option. This will make sure to update the loader to use an absolute path.

Moreover, Transloco will add a `baseUrl` key to the `environment` object. Make sure to update it based on your environment.

{% code title="environment.ts" %}
```typescript
export const environment = {
  production: false,
  baseUrl: 'http://localhost:4200' <====
};

```
{% endcode %}
