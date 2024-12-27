---
description: A collection of common questions and their answers.
---

# ❓ FAQs

### Why does the translation fail when using `translate()` inside `ngOnInit`, but work with the structural directive?

The issue arises because loading translations is asynchronous, while `translate()` is synchronous. You have two options to fix this:

1. Subscribe to Transloco service events and call `translate()` inside the subscription.
2. Use `selectTranslate()` instead.

The structural directive works because it waits for the translation to load before rendering, which is why it works in the template.

***

### Can I use an Angular component inside a translation string?

It’s not possible with AOT compilation. However, you can:

1. Convert the component into a web component using `@angular/elements` and use the custom tag in the translation.
2. Split the translation into two parts and insert the component in between.

***

### What about `getBrowserLang()` in SSR?

`getBrowserLang()` only works in the browser context. For SSR, set a default language as a fallback:

```typescript
const defaultLang = getBrowserLang() || 'en';
```

***

### Can I include HTML markup inside a translation?

Yes, you can use HTML tags in your translations by binding the translated string to `innerHTML`.

You can also check out ngx-transloco-markup.

***

### Isn’t calling a function from the template using the structural directive bad practice?

No, it's actually recommended. The structural directive is efficient and DRY, as it creates a single subscription in the template. Additionally, `t` is memoized, meaning repeated translations for the same key are cached. When using the OnPush change detection strategy, this can significantly reduce change detection cycles.

***

### Why do values not get translated in unit tests?

In unit tests, it’s your responsibility to ensure that translations are loaded before calling `translate()`. To make sure translations are ready, set `preloadLangs: true` in the options passed to `TranslocoTestingModule.forRoot`.

***

### Why doesn't querying an element inside the `*transloco` directive with `@ViewChild()` work?

The `*transloco` directive involves an asynchronous operation that fetches translations. As a result, the element inside the directive is not available until the translations are loaded. To access the element after rendering, use a setter for the `ViewChild`.

***

### I'm having \`flat\` related issues when running Jest tests after upgrading to the latest version of Transloco. How can I resolve this?

This issue is primarily related to Jest's ESM support and is not directly tied to Transloco. However, you can upgrade to Transloco v7.5.1+ where the flat dependency was removed, or alternatively, you can try one of the solutions suggested in [this GitHub issue](https://github.com/jsverse/transloco/issues/714).
