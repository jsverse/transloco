# Keys Detective

This tool serves two purposes: First, it identifies keys present in one translation file but missing from others. Second, it detects keys that exist in the translation files but are not used in any templates or TypeScript files.

After installing the library, you should see the following script in your project's `package.json` file:

```json
"scripts": {
  "i18n:find": "transloco-keys-manager find"
}
```

Run `npm run i18n:find`, and you'll get a lovely list that summarizes the keys found.
