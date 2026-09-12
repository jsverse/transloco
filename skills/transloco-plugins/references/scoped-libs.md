# Scoped Library Extractor (`@jsverse/transloco-scoped-libs`)

For monorepos publishing Angular libraries that ship their own translations (e.g. `projects/core/src/lib/i18n/*.json`). Webpack dynamic imports and the app's public folder aren't directly reachable from a library, so this tool copies/joins the library's translation files into the app's translation folder automatically instead of doing it by hand.

Requires Node.js `>=22` (v9+); `chokidar` v5 is ESM-only.

## Setup

1. In the library, declare the scope and use it normally:
   ```typescript
   @NgModule({
     providers: [provideTranslocoScope('core')],
     imports: [TranslocoModule],
   })
   export class CoreModule {}
   ```
   ```html
   <ng-container *transloco="let t">{{ t('core.title') }}</ng-container>
   ```
2. Install: `npm install -D @jsverse/transloco-scoped-libs`
3. In the library's `package.json`, declare its i18n source:
   ```json
   {
     "name": "@app/core",
     "i18n": [{ "scope": "core", "path": "src/lib/i18n" }]
   }
   ```
4. In the app's global config (see transloco-core's global config), list the library:
   ```typescript
   const config: TranslocoGlobalConfig = { scopedLibs: ['./projects/core/'] };
   // or, for multiple destinations:
   // scopedLibs: [{ src: './projects/core', dist: ['./projects/spa/src/assets/i18n'] }]
   ```
5. Add a script and run it: `"transloco:extract-scoped-libs": "transloco-scoped-libs --watch"`.

This also adds the copied files to `.gitignore` automatically (`--skip-gitignore` to opt out).

## Join strategy

Default strategy copies each library's files individually. Set `"strategy": "join"` in the library's `package.json` `i18n` entry to combine all of a library's files into one `<lang>.vendor.json`, then merge it in a custom loader:

```typescript
getTranslation(lang: string, { scope }: { scope?: string } = {}) {
  const base = this.http.get(`/assets/i18n/${lang}.json`);
  if (!scope) return base;

  const [, realLang] = lang.split('/'); // lang arrives as "<scope>/<lang>" for scoped requests
  return forkJoin([
    base,
    this.http.get(`/assets/i18n/${realLang}.vendor.json`),
  ]).pipe(map(([t, vendor]) => ({ ...t, [scope]: vendor[scope] })));
}
```

## Webpack

```javascript
const TranslocoScopedLibsWebpackPlugin = require('@jsverse/transloco-scoped-libs/webpack');
module.exports = { plugins: [new TranslocoScopedLibsWebpackPlugin()] };
```

Anti-pattern: manually copy-pasting a shared library's translation JSON into the consuming app's assets on every change — that's exactly what this tool automates.
