# Create Libraries

- ng g library `@ngneat/transloco-lib-name`

Add to the main `package.json` the following scripts:

```
{
 "scripts": {
   "build:lib-name": "ng build @ngneat/transloco-lib-name"
   "test:lib-name": "ng test @ngneat/transloco-lib-name",
  }
}
```

Add to `tsconfig.json` file the library `path`:

```json
"paths": {
  "@ngneat/transloco-lib-name": ["./projects/ngneat/transloco-lib-name/src/public-api.ts"]
}
```

Add `@ngneat/transloco` to `peerDependencies`.

Create the library and add specs.

### Transloco Dependency

In development mode, you can use APIs from `ngneat/transloco` in your library, and everything will work.

When you need to build the library, you'll need to do the following for the build to pass:

- In the library folder run npm i `@ngneat/transloco --no-save`
- Remove the following line from `tsconfig.lib.json`:
  `"extends": "../../../tsconfig.json"`

Now you should be able to build the library.
