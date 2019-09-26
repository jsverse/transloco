# Transloco Upgrade script

`ng g @ngneat/transloco:upgrade`

## What will be done?

The script will iterate recursively over all your `HTML` files and will replace the code as the following:

#### Before

```html
<ng-container *transloco="let t">
  <p>{{ t.title }}</p>
</ng-container>
```

#### After

```html
<ng-container *transloco="let t">
  <p>{{ t['title']}}</p>
</ng-container>
```

### Issues

If you encounter any issues with the script please notice us by open an issue, so we can make a better upgrade experience for everyone.
