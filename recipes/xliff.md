```ts
import { HttpClient } from '@angular/common/http';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from '@ngneat/transloco';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import xliff from 'xliff/xliff12ToJs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(langPath: string) {
    return this.http.get(`/assets/i18n/${langPath}.xlf`, { responseType: 'text' as 'text' }).pipe(
      map(translation => {
        const toJSON = xliff(translation);
        return toTranslationFormat(toJSON);
      })
    );
  }
}

function toTranslationFormat(json) {
  const obj = json.resources.transloco;
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key].target;
    return acc;
  }, {});
}

export const translocoLoader = { provide: TRANSLOCO_LOADER, useClass: HttpLoader };
```

The translation file:

```xlf
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="transloco">
    <body>
      <trans-unit id="title">
        <source>Hello Transloco!</source>
        <target>Bonjour Transloco!</target>
      </trans-unit>
    </body>
  </file>
</xliff>
```
