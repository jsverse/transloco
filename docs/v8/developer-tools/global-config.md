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
  langs?: string[];
  keysManager: {
    input?: string | string[];
    output?: string;
    fileFormat?: 'json' | 'pot';
    marker?: string;
    addMissingKeys?: boolean;
    emitErrorOnExtraKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
    unflat?: boolean;
  }
};

export default config;
```

