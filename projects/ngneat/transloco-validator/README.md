# Validation Translation files

This package provides validation for translation files. It validates that the JSON is valid and that it doesn't contain duplicates keys.

## Installation

- Set up husky and [lint-staged](https://github.com/okonet/lint-staged#examples)
- Run `npm i @ngneat/transloco-validator`

## Usage

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/i18n/*.json": ["transloco-validator"]
  }
}
```

This will make sure no one accidentally pushes an invalid translation file.
