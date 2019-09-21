# Transloco Schematics

Transloco schematics built on top of `schematics/angular` and provides CLI commands for generating transloco boilerplate files.

## Ng-add

### Overview

Creates boilerplate translation files for given languages, and add Transloco configuration for the project's root module.

### Command

```
  ng add @ngneat/transloco
```

### Options

#### Create the translation files along with the required configuration.

- `--langs`

  `type`: `string`

  `default`: `en, es`

#### Provides the translation files loader.

- `--loader`

  `type`: `string`

  `default`: `Http`

  `options`: `Http`, `Webpack`

  `alias`: `lo`

#### Define the translation files format.

- `--translate-type`

  `type`: `string`

  `default`: `JSON`

  `options`: `JSON`, `Typescript`

  `alias`: `t`

#### Provides the configuration that is needed for a project using server side rendering.

- `--ssr`

  `type`: `boolean`,

  `default`: `false`

#### Define the location of the translation files.

- `--path`

  `type`: `string`

  `default`: `assets/i18n/`

  `alias`: `p`

#### Provide the name of the project where Transloco should be installed to.

- `--project`

  `type`: `string`

#### Provide the path to a root `Module` and import `TranslocoModule` along with the module's required configuration defined by previous flags.

- `--module`

  `type`: `string`

  `default`: `app`

## Migrate

### Overview

Migration script from `ngx-translate`. For more information about the script see:
[migrartion.md](https://github.com/ngneat/transloco/tree/master/schematics/migration.md)

### Command

```
  ng genrate @ngneat/transloco:migrate
```

### Options

#### Define the entry path of the migration script.

- `--path`

  `type`: `string`

  `default`: `./src/app`

  `alias`: `p`

## Component

### Overview

Creates boilerplate files for Angular `component` with a simple translation

### Command

```
  ng generate @ngneat/transloco:component [name]
```

### Options

#### Define the component's name.

- `--name`

  `type`: `string`

## Scope

### Overview

Add new Transloco scope to a new/existing Angular `module`, and create the scope's translation files.

### Command

```
  ng generate @ngneat/transloco:scope [name]
```

### Options

#### Define the name of the new scope.

- `--name`

  `type`: `string`

#### Define the path at which module to add scope to, relative to the workspace root.

Note if this flag won't be provide a new Module should be created.

- `--module`

  `type`: `string`

#### Define the languages of the scope, default is the root languages.

- `--langs`

  `type`: `string`

  `alias`: `la`

#### Skip the translation files creation.

- `--skip-creation`

  `type`: `boolean`

#### Define the translation files format.

- `--translate-type`

  `type`: `string`

  `default`: `JSON`

#### Define the location of the translation files.

- `--translation-filesPath`

  `type`: `string`
