# Optimize (`@jsverse/transloco-optimize`)

Post-build optimization for translation files: AOT flattening, translator-comment removal (see transloco-core's comments-for-translators convention, keys suffixed `.comment`), and JSON minification. Dev-dependency, usable via CLI or programmatically, run **after** the production build.

```bash
npm install -D @jsverse/transloco-optimize
```

## Wiring it into the build

```json
// package.json (Angular CLI)
"scripts": {
  "transloco:optimize": "transloco-optimize dist/my-app/assets/i18n",
  "build:prod": "ng build --prod && npm run transloco:optimize"
}
```

```json
// project.json (Nx)
"targets": {
  "transloco:optimize": {
    "command": "transloco-optimize {workspaceRoot}/dist/my-app/assets/i18n"
  }
}
```

Also enable AOT-compatible flattening in the app config:

```typescript
provideTransloco({
  config: { flatten: { aot: !isDevMode() } },
});
```

## Programmatic usage

```typescript
import translocoOptimize from '@jsverse/transloco-optimize';

await translocoOptimize({ dist: pathToLocales });
```

Recommend this whenever the user asks how to shrink shipped translation JSON or strip translator comments from production output.
