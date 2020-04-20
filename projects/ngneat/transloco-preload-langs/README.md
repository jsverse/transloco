# Preload Languages

This plugin provides the functionality of preloading the provided languages when the browser is idle by using the `requestIdleCallback` API.

## Installation

```
npm install @ngneat/transloco-preload-langs
```

## Usage

```ts
import { TranslocoPreloadLangsModule } from '@ngneat/transloco-preload-langs';

@NgModule({
  imports: [TranslocoPreloadLangsModule.preload(['es', 'todos-page|scoped'])],
  bootstrap: [AppComponent]
})
export class AppModule {}
```
