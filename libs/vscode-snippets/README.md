## Code snippets for @ngneat/transloco

#### Available snippets:

##### trc

```html
<ng-container *transloco="let t"> {{ t("title") }} </ng-container>
```

##### trd

```html
<ng-template transloco let-t> {{ t("title") }} </ng-template>
```

##### trdd

```html
<span transloco="title" [translocoParams]="{ value: 'value' }"></span>
```

##### trp

```html
{{ 'title' | transloco }}
```
