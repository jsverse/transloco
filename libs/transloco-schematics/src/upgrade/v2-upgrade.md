# Transloco v2 Upgrade script

`ng g @jsverse/transloco:upgrade`

## What will be done?

The script will update your transloco config as the following:

- `scopeStrategy` property will be removed (if it exists).
- `listenToLangChange` property will be renamed to `reRenderOnLangChange`.
- `availableLangs` property will be added with the value of your default lang.

The script will iterate recursively over all your `HTML` files and will replace the code as the following:

#### Before

```html
<ng-container *transloco="let t">
  <p>{{ t.title }}</p>
  <p>{{ t.hello | translocoParams:{ name: 'world' } }}</p>
</ng-container>
```

#### After

```html
<ng-container *transloco="let t">
  <p>{{ t('title')}}</p>
  <p>{{ t('hello', { name: 'world' })}}</p>
</ng-container>
```

### Issues

If you encounter any issues with the script please notice us by open an issue, so we can make a better upgrade experience for everyone.
