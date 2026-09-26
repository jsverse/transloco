## 9.0.0-alpha.4 (2026-09-26)

### 📦 Build

- ⚠️  **utils:** upgrade cosmiconfig to v10 ([#1031](https://github.com/jsverse/transloco/pull/1031))

### ⚠️  Breaking Changes

- **utils:** upgrade cosmiconfig to v10 ([#1031](https://github.com/jsverse/transloco/pull/1031))
  - TS configs (`transloco.config.ts`) are now loaded with Node's type stripping. Type imports must use `import type { TranslocoGlobalConfig }`; `ng update` migrates this automatically. Syntax that needs compiling, such as `enum` and `namespace`, is no longer supported in a config.
  - `@jsverse/transloco-utils`, `@jsverse/transloco-keys-manager` and `@jsverse/transloco-scoped-libs` now require Node `^22.18.0 || >=24`.

### ❤️ Thank You

- Shahar Kazaz @shaharkazaz

## 9.0.0-alpha.3 (2026-09-25)

### 🚀 Features

- ⚠️  **keys-manager:** remove the webpack plugin ([#1024](https://github.com/jsverse/transloco/pull/1024))

### ⚠️  Breaking Changes

- **keys-manager:** remove the webpack plugin  ([#1024](https://github.com/jsverse/transloco/pull/1024))

### ❤️ Thank You

- Shahar Kazaz @shaharkazaz

## 9.0.0-alpha.2 (2026-09-09)

### 🩹 Fixes

- **transloco:** include LICENSE in all published packages ([#996](https://github.com/jsverse/transloco/pull/996))

### ❤️ Thank You

- Shahar Kazaz @shaharkazaz

## 9.0.0-alpha.1 (2026-08-19)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 9.0.0-alpha.0 (2026-08-19)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.4.0 (2026-06-13)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.3.0 (2026-04-05)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.2.1 (2026-01-19)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.2.0 (2025-11-15)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.1.0 (2025-10-11)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.0.2 (2025-09-26)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

## 8.0.1 (2025-09-26)

This was a version bump only for transloco-schematics to align it with other projects, there were no code changes.

# 8.0.0 (2025-09-14)

### 🚀 Features

- **schematics:** 🎸 Introduce new schematics-core library for shared utilities ([053a4fa8](https://github.com/jsverse/transloco/commit/053a4fa8))

### 🤖 Chore

- **schematics:** 🤖 introduce a new schematics-core lib ([d1316746](https://github.com/jsverse/transloco/commit/d1316746))
- **schematics:** 🤖 sync schematics-core ([a65642cc](https://github.com/jsverse/transloco/commit/a65642cc))

### 💡 Refactor

- **schematics:** 💡 restructure schematics codebase ([61d7d97e](https://github.com/jsverse/transloco/commit/61d7d97e))
- **schematics:** 💡 use the schematics core ([af028b58](https://github.com/jsverse/transloco/commit/af028b58))
- **schematics:** 💡 rename schematic ids ([369bb61c](https://github.com/jsverse/transloco/commit/369bb61c))
- **schematics:** 💡 ngx-migrate ([5e147332](https://github.com/jsverse/transloco/commit/5e147332))
- **schematics:** 💡 move tests to dirs ([b6d650db](https://github.com/jsverse/transloco/commit/b6d650db))
- **schematics:** 💡 remove replace-in-file, lodash and ora ([56d6fb45](https://github.com/jsverse/transloco/commit/56d6fb45))
- **schematics:** 💡 update package.json ([0f8dc12b](https://github.com/jsverse/transloco/commit/0f8dc12b))
- **schematics:** 💡 update build ([c47e57b2](https://github.com/jsverse/transloco/commit/c47e57b2))

### ⚠ BREAKING CHANGES

- **schematics:** 🧨 Remove the format option from the split & join schematics commands
- **schematics:** 🧨 Minimum node version is now 18
- **schematics:** 🧨 Removed component and upgrade schematics
- **schematics:** 🧨 Renamed migrate directory to ngx-migrate for clarity

### ❤️ Thank You

- shaharkazaz @shaharkazaz
