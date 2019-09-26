import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { run } from './v2';
import { SchemaOptions } from './schema';

export default function(options: SchemaOptions): Rule {
  return () => {
    if (!options.path) {
      throw new SchematicsException(`
        Please specify the root source of your project.
        (e.g. --path ./src/app)
      `);
    }

    return run(options.path);
  };
}
