import { Rule } from '@angular-devkit/schematics';
import { run } from './ng-migrate';
import { SchemaOptions } from './schema';
import { exit } from 'process';

export default function (options: SchemaOptions): Rule {
  return () => {
    const langs = options.langs.split(',').map((l) => l.trim());
    run({ input: options.path, output: options.translationFilesPath, langs });
    // prevent "nothing to be done".
    exit();
  };
}
