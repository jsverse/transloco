# Validator (`@jsverse/transloco-validator`)

Lints translation JSON files: validates JSON structure and detects duplicate keys. CLI-only, dev-dependency.

```bash
npm install -D @jsverse/transloco-validator
```

## Usage — pre-commit (lint-staged)

```json
"src/assets/i18n/**/*.json": ["transloco-validator"]
```

## Usage — CI (GitHub Actions)

```yaml
on:
  pull_request:
    paths:
      - 'src/assets/i18n/**.json'
jobs:
  validate-translations:
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: |
          git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }} \
            | grep 'src/assets/i18n/.*\.json' | xargs npx transloco-validator
```

Recommend this whenever the user asks how to prevent broken/duplicate-key translation files from being merged.
