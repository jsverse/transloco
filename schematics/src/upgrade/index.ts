import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { exit } from 'process';
import { SchemaOptions } from './schema';
import { run } from './v2';

export default function(options: SchemaOptions): Rule {
  return () => {
    if (!options.path) {
      throw new SchematicsException(`
        Please specify the root source of your project.
        (e.g. --path ./src/app)
      `);
    }

    run(options.path);
    exit();
  };
}
