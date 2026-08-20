---
icon: gear
---

# Global Config

This config is used by tools & plugins such as the scoped lib extractor and the keys manager.

If you installed Transloco via the schematics, a `transloco.config.ts` should have been created. Otherwise, you can just create a `transloco.config.ts` in the project's root folder and add the configuration in it:

```typescript
import { TranslocoGlobalConfig } from "@jsverse/transloco-utils";

const config: TranslocoGlobalConfig = {
  rootTranslationsPath?: string;
  defaultLang?: string;
  scopedLibs?: string[] | Array<{ src: string; dist: string[] }>;
  scopePathMap?: Record<string, string>;
  langs?: string[];
  keysManager?: {
    input?: string | string[];
    output?: string;
    fileFormat?: 'json' | 'pot';
    marker?: string;
    addMissingKeys?: boolean;
    emitErrorOnExtraKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
    unflat?: boolean;
    sort?: boolean;
  };
};

export default config;
```

## Configuration Properties

### Core Properties

- **`rootTranslationsPath`** - The path to your root translation files directory (default: `src/assets/i18n`)
- **`defaultLang`** - The default language of your application
- **`langs`** - Array of supported languages in your application

### Scoped Libraries

- **`scopedLibs`** - Configuration for the [Scoped Library Extractor](./scoped-library-extractor.md) tool. Defines which library translation files to copy during build. Can be:
  - `string[]` - Array of library paths to copy from their default i18n paths
  - `Array<{ src: string; dist: string[] }>` - Custom source and destination mappings

### Translation Path Mapping

- **`scopePathMap`** - Custom mappings between scope names and their file system paths. Used by the [join](./schematics/join.md) and [split](./schematics/split.md) schematics when your translation files don't follow the default directory structure.

  Example:

  ```typescript
  scopePathMap: {
    'my-scope': 'src/app/path-to-scope',
    'my-project-scope': 'projects/my-project/i18n',
  }
  ```

### Keys Manager

The `keysManager` property configures the behavior of the translation keys extraction and management tool.
