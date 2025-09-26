## 8.0.1 (2025-09-26)


### 🩹 Fixes

- **transloco:** 🐛 add utils and transloco-utils as dependencies ([#872](https://github.com/jsverse/transloco/pull/872))

### ❤️  Thank You

- Cédric Exbrayat @cexbrayat

# 8.0.0 (2025-09-14)

### 🚀 Features

- **locale:** 🎸 improve locale detection logic in locale service ([73d21aa0](https://github.com/jsverse/transloco/commit/73d21aa0))
- **schematics:** 🎸 Introduce new schematics-core library for shared utilities ([053a4fa8](https://github.com/jsverse/transloco/commit/053a4fa8))

### 🩹 Fixes

- **transloco:** 🐛 fix wrong import ([e65f9f28](https://github.com/jsverse/transloco/commit/e65f9f28))

### 🤖 Chore

- **transloco:** 🤖 move to @jsverse/utils ([aae425b6](https://github.com/jsverse/transloco/commit/aae425b6))
- **transloco:** 🤖 Add package optimizations ([0fad5d06](https://github.com/jsverse/transloco/commit/0fad5d06))
- **locale:** 🤖 Add package optimizations ([2bc8485c](https://github.com/jsverse/transloco/commit/2bc8485c))
- **messageformat:** 🤖 Add package optimizations ([24d82d4a](https://github.com/jsverse/transloco/commit/24d82d4a))
- **persist-lang:** 🤖 update persist-lang to correct utils version ([e435e9b3](https://github.com/jsverse/transloco/commit/e435e9b3))

### 💡 Refactor

- **transloco:** 💡 Remove all the schematics but init ([6cd2f3e2](https://github.com/jsverse/transloco/commit/6cd2f3e2))
- **transloco:** 💡 set tslib as dependency ([e76cb87a](https://github.com/jsverse/transloco/commit/e76cb87a))
- **transloco:** 💡 remove flat from transloco's API ([1d241984](https://github.com/jsverse/transloco/commit/1d241984))
- **schematics:** 💡 restructure schematics codebase ([0f8dc12b](https://github.com/jsverse/transloco/commit/0f8dc12b))
- **schematics:** 💡 remove format from split and join ([053a4fa8](https://github.com/jsverse/transloco/commit/053a4fa8))
- **persist-lang:** 💡 Add package optimizations ([d82c4bd5](https://github.com/jsverse/transloco/commit/d82c4bd5))
- **persist-translations:** 💡 Add package optimizations ([b3933185](https://github.com/jsverse/transloco/commit/b3933185))
- **preload-langs:** 💡 Add package optimizations ([5069fa48](https://github.com/jsverse/transloco/commit/5069fa48))
- **optimize:** 💡 update node version ([d4d275ba](https://github.com/jsverse/transloco/commit/d4d275ba))
- **scoped-libs:** 💡 update node version ([a9f6bc24](https://github.com/jsverse/transloco/commit/a9f6bc24))
- **utils:** 💡 update node version ([a1f5b097](https://github.com/jsverse/transloco/commit/a1f5b097))
- **validator:** 💡 update node version ([1ea9bf2f](https://github.com/jsverse/transloco/commit/1ea9bf2f))

### 💍 Tests

- **transloco:** 💍 silent console errors in fallback specs ([8e27859a](https://github.com/jsverse/transloco/commit/8e27859a))
- **messageformat:** 💍 fix test ([4edf9afc](https://github.com/jsverse/transloco/commit/4edf9afc))

### ✏️ Docs

- **transloco:** ✏️ update breaking changes file ([5435da74](https://github.com/jsverse/transloco/commit/5435da74))

### ⚠ BREAKING CHANGES

- **All packages:** 🧨 Minimum Node.js version is now 18
- **transloco:** 🧨 ng-add is the only available schematic in @jsverse/transloco now - other schematics moved to @jsverse/transloco-schematics
- **transloco:** 🧨 Some utility functions are no longer part of Transloco's public API - moved to @jsverse/utils
- **schematics:** 🧨 Remove the format option from the split & join schematics commands
- **schematics:** 🧨 Removed component and upgrade schematics
- **schematics:** 🧨 Renamed migrate directory to ngx-migrate for clarity

### ❤️ Thank You

- chaitanay94 @chaitanay94
- shaharkazaz @shaharkazaz
