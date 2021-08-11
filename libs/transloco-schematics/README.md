# Transloco Schematics

Transloco schematics are built on top of `schematics/angular` and provide CLI commands for generating transloco boilerplate files.

## Ng-add

### Overview

Creates boilerplate translation files for the given languages, and adds Transloco configuration for the project's root module.

### Command

```
  ng add @ngneat/transloco
```

### Options

#### Create the translation files along with the required configuration.

- `--langs`

  `type`: `string`

  `default`: `en, es`

#### Provide the translation files loader.

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

#### Provide the configuration that is needed for a project using server side rendering.

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
[ngx-translate-migration.md](https://github.com/ngneat/transloco/tree/master/schematics/src/migrate/ngx-translate-migration.md)

### Command

```
  ng generate @ngneat/transloco:migrate
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

#### Skip the creation of the translation files.

- `--skip-creation`

  `type`: `boolean`

#### Define the format of the translation files.

- `--translate-type`

  `type`: `string`

  `default`: `JSON`

#### Define the location of the translation files.

- `--translation-path`

  `type`: `string`

## Join

### Overview

Merge all of the project's translation files into one.

By default the join command will go over the root translation file directory and will refer every sub directory as scope.

Note, if you have more than one entry folder for your translation files, you will have to add a mapping for each folder entry and the scope name. It could be done using `scopePathMap` property in your `transloco.config.js` file.

### Command

```
  ng generate @ngneat/transloco:join
```

### Options

#### The folder that contains the root translation files.

- `--translation-path`

  `type`: `string`

  `default`: `src/assets/i18n`

  `alias`: `root`

#### The output directory path.

- `--out-dir`

  `type`: `string`

  `default`: `dist-i18n`

  `alias`: `o`

## Split

### Overview

Does the opposite process of `join` command. It splits the translated files between the project's translation files.

### Command

```
  ng generate @ngneat/transloco:split
```

### Options

#### The folder that contains the root translation files.

- `--translation-path`

  `type`: `string`

  `default`: `src/assets/i18n`

  `alias`: `root`

#### The path of the source directory that contains the translated files.

- `source`

  `type`: `string`

  `default`: `dist-i18n`

  `alias`: `o`
