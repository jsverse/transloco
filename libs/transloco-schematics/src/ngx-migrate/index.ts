import { Rule, SchematicContext } from '@angular-devkit/schematics';
import { migrateNgxTranslate } from '@jsverse/transloco-cli/internal/migrate';

import { deprecationWarning } from '../translation-files';

import { SchemaOptions } from './schema';

export default function (options: SchemaOptions): Rule {
  return (_, context: SchematicContext) => {
    context.logger.warn(deprecationWarning('ngx-migrate'));
    migrateNgxTranslate({ input: options.path });
  };
}
