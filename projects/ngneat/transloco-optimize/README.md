# Transloco Optimize

This library will do the following things:

- AOT translation file flatting
- Remove translators [comments](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-remove-comments)
- Minify the JSON file

## Installation

```
npm install @ngneat/transloco-optimize
```

## Usage

Add to your `package.json` the following script:

```json
"scripts": {
  "transloco:optimize": "transloco-optimize dist/appName/assets/i18n",
  "build:prod": "ng build --prod && npm run transloco:optimize",
}
```

Then, add the following `config` option to the application Transloco config object:

```ts
import { environment } from '../environments/environment';

{
  ...
  flatten: {
    aot: environment.production,
  },
};
```

You can also use it as a function:

```js
import translocoOptimize from '@ngneat/transloco-optimize';
import { task } from 'gulp';

const pathToLocales = ...  // e.g: `${__dirname}/dist/${appName}/assets/i18n`;
task('transloco:optimize', function(cb) {
  translocoOptimize({ dist: pathToLocales }).then(cb);
});
```
