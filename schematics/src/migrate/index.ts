import { Rule, SchematicsException, noop } from '@angular-devkit/schematics';
import { run } from './migration';
import { SchemaOptions } from './schema';

export default function(options: SchemaOptions): Rule {
  return () => {
    if (!options.path) {
      throw new SchematicsException(`
        Please specify the root source of your project.
        (e.g. --path ./src/app)
      `);
    }

    run(options.path);

    return noop();
  };
}
