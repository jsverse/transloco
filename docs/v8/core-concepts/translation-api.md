---
description: A list of the TranslocoService API methods and their usages
---

# Translation API

{% hint style="success" %}
Check out the new [signal translation API](signals.md) 🚦
{% endhint %}

## **`translate()`**

Translate a given key, allowing optional parameters for dynamic values or language specification. Use this method when you need to translate keys directly in components or services.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.translate('hello');
    this.translocoService.translate('hello', { value: 'world' });
    this.translocoService.translate(['hello', 'key']);
    this.translocoService.translate('hello', params, 'es');

    // Translate a key from a specific scope
    this.translocoService.translate('hello', params, 'todos/en');
  }
}
```

{% hint style="warning" %}
**Important**\
Ensure translation files are loaded before calling this method. Otherwise, use `selectTranslate()`.
{% endhint %}

***

## **`selectTranslate()`**

Returns an observable that emits translations. It loads the required translation file automatically.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.selectTranslate('hello').subscribe(value => ...);
    this.translocoService.selectTranslate('hello', params).subscribe(value => ...);
    this.translocoService.selectTranslate('hello', params, 'es').subscribe(value => ...);
  }
}
```

* Automatically updates when the active language changes.
* Supports scoped translations via `TRANSLOCO_SCOPE`.

***

## **`translateObject()`**

Retrieve a nested object or an array of translated values based on keys.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    let result = this.translocoService.translateObject('some.object');
    expect(result).toEqual({ hi: 'Hi', hey: 'Hey' });

    result = this.translocoService.translateObject('path.to.object', {
      welcome: { name: 'John' },
      'nested.subscribe': { price: 100 },
    });
    expect(result).toEqual({
      welcome: 'Welcome John',
      nested: { subscribe: 'subscribe today for 100$' },
    });
  }
}
```

{% hint style="warning" %}
**Important**\
Ensure translation files are loaded before calling this method. Otherwise, use `selectTranslateObject()`.
{% endhint %}

***

## **`selectTranslateObject()`**

Similar to `translateObject()`, but returns an observable. It ensures the translation file is loaded.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService
      .selectTranslateObject('path.to.object', {
        welcome: { name: 'John' },
        'nested.subscribe': { price: 100 },
      })
      .subscribe(result => {
        expect(result).toEqual({
          welcome: 'Welcome John',
          nested: { subscribe: 'subscribe today for 100$' },
        });
      });
  }
}
```

***

## **`getTranslation()`**

Retrieve the entire translation map for the active language or a specific language/scope.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.getTranslation();
    this.translocoService.getTranslation('es');
    this.translocoService.getTranslation('todos/es');
  }
}
```

***

## **`selectTranslation()`**

Returns an observable that emits the full translation map for the specified language or scope.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.selectTranslation('es').subscribe(console.log);
    this.translocoService.selectTranslation('todos/es').subscribe(console.log);
    this.translocoService.selectTranslation().subscribe(console.log); // Updates on language change
  }
}
```

***

## **`setTranslation()`**

Manually sets translation data for a language or scope. Use `merge: true` to append data.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.setTranslation({ key: 'value' });
    this.translocoService.setTranslation({ ... }, 'es');
    this.translocoService.setTranslation({ ... }, 'en', { merge: false });
    this.translocoService.setTranslation({ ... }, 'todos/en');
  }
}
```

***

## **`setTranslationKey()`**

Set or update the value of a specific translation key.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.setTranslationKey('key', 'value');
    this.translocoService.setTranslationKey('key.nested', 'value');
    this.translocoService.setTranslationKey('key', 'value', 'en');
    this.translocoService.setTranslationKey('key', 'value', 'en', { emitChange: false });
  }
}
```

***

## **`events$`**

Listen to translation events, such as language changes or load failures.

```typescript
app.component.ts
export class AppComponent {
  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.translocoService.events$
      .pipe(filter(e => e.type === 'translationLoadSuccess'), pluck('payload'))
      .subscribe(({ langName, scope }) => ...);

    this.translocoService.events$
      .pipe(filter(e => e.type === 'langChanged'), pluck('payload'))
      .subscribe(({ langName }) => ...);
  }
}
```

{% hint style="warning" %}
**Important**\
Events only fire when translations are loaded from the server, not from the cache.
{% endhint %}

