import { Rule, SchematicsException, schematic } from '@angular-devkit/schematics';
import { fromPromise } from 'rxjs/internal-compatibility';
import { map } from 'rxjs/operators';
import { run } from './ngx-translate-migration';
import { SchemaOptions } from './schema';

export default function(options: SchemaOptions): Rule {
  return tree => {
    if (!options.path) {
      throw new SchematicsException(`
        Please specify the root source of your project.
        (e.g. --path ./src/app)
      `);
    }

    return options.from === 'Angular'
      ? schematic('ng-migrate', options)
      : fromPromise(run(options.path)).pipe(map(() => tree));
  };
}
