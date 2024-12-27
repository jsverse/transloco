# Unit Testing

{% hint style="info" %}
**Note**

If you're encountering issues running unit tests with Jest and Transloco due to the flat library, try upgrading to **Transloco v7.5.1**, where the flat dependency has been removed.
{% endhint %}

When running tests, it's important to have the languages available immediately and synchronously. **Transloco** provides the `TranslocoTestingModule`, which allows you to specify the languages and configuration needed for your specs.

To follow the **DRY** (Don't Repeat Yourself) principle, it's a good idea to create a module factory function that can be reused in each spec. Here's an example:

{% code title="transloco-testing.module.ts" %}
```typescript
import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';
import en from '../assets/i18n/en.json';
import es from '../assets/i18n/es.json';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { en, es },
    translocoConfig: {
      availableLangs: ['en', 'es'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
```
{% endcode %}

### Using the module in your spec files

<pre class="language-typescript" data-title="app.component.spec.ts"><code class="lang-typescript">describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
<strong>      imports: [getTranslocoModule()],
</strong>      declarations: [AppComponent],
    }).compileComponents();
  }));

  it('should work', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('h1')).nativeElement.innerText
    ).toBe('hello');
  });
});
</code></pre>

You can find a full example [here](https://github.com/jsverse/transloco/blob/master/apps/transloco-playground/src/app/on-push/on-push.component.spec.ts).

### Testing scopes

If you need to test scopes, you should add them as languages. For example:

<pre class="language-typescript" data-title="transloco-testing.module.ts"><code class="lang-typescript">export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      en,
      es,
<strong>      'admin-page/en': admin,
</strong><strong>      'admin-page/es': adminSpanish,
</strong>    },
    translocoConfig: {
      availableLangs: ['en', 'es'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
</code></pre>

You can find an example [here](https://github.com/jsverse/transloco/blob/master/apps/transloco-playground/src/app/lazy/lazy.component.spec.ts).

### TypeScript Configuration

To import JSON files in your TypeScript project, you need to update your `tsconfig.json` with the following properties:

```json
{
  "resolveJsonModule": true,
  "esModuleInterop": true
}
```
