---
description: A list of TranslocoService language-related API methods and their usages
---

# Language API

## **`getDefaultLang()`**

Returns the default language of the application.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    const defaultLang = translocoService.getDefaultLang();
    console.log(defaultLang);
  }
}
```

***

## **`setDefaultLang()`**

Sets the default language.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.setDefaultLang('es');
  }
}
```

***

## **`getActiveLang()`**

Returns the current active language.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    const activeLang = translocoService.getActiveLang();
    console.log(activeLang);
  }
}
```

***

## **`setActiveLang()`**

Sets the active language for the application.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.setActiveLang('es');
  }
}
```

***

## **`getAvailableLangs()`**

Retrieves the list of available languages.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    const availableLangs = translocoService.getAvailableLangs();
    console.log(availableLangs);
  }
}
```

***

## **`setFallbackLangForMissingTranslation()`**

Defines a fallback language to be used when a translation key is missing for the active language.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.setFallbackLangForMissingTranslation({
      fallbackLang: 'he',
    });
  }
}
```

{% hint style="info" %}
**Note**\
If you provide an array, only the first language is used. Fallback translations for missing keys support a single language.
{% endhint %}

***

## **`setAvailableLangs()`**

Sets the list of available languages.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.setAvailableLangs(['en', 'es']);

    // Alternatively, use an array of objects for additional metadata
    translocoService.setAvailableLangs([{ id: 'en', label: 'English' }]);
  }
}
```

***

## **`langChanges$`**

An observable that emits whenever the active language changes.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.langChanges$.subscribe(lang => {
      console.log(`Language changed to: ${lang}`);
    });
  }
}
```

{% hint style="info" %}
**Note**\
`langChanges$` will emit the currently active language immediately upon subscription.
{% endhint %}

***

## **`load()`**

Loads the specified language and adds it to the service.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {
    translocoService.load('en').subscribe(() => {
      console.log('Language loaded successfully');
    });
  }
}
```
