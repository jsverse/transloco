import { exit } from 'process';

import { Rule, SchematicContext } from '@angular-devkit/schematics';
import { migrateAngularI18n } from '@jsverse/transloco-cli/internal/migrate';

import { deprecationWarning } from '../translation-files';

import { SchemaOptions } from './schema';

export default function (options: SchemaOptions): Rule {
  return (_, context: SchematicContext) => {
    context.logger.warn(deprecationWarning('ng-migrate'));
    const langs = options.langs.split(',').map((l) => l.trim());
    migrateAngularI18n({
      input: options.path,
      output: options.translationFilesPath,
      langs,
    });
    // prevent "nothing to be done".
    exit();
  };
}
