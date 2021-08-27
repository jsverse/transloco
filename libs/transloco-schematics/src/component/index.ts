import {
  Rule,
  Tree,
  SchematicContext,
  externalSchematic,
} from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export default function (options): Rule {
  return (host: Tree, context: SchematicContext) => {
    const template = `<ng-template transloco let-t>
  <h1> {{ t('title') }} </h1>
</ng-template>
`;

    const cmpRule = externalSchematic(
      '@schematics/angular',
      'component',
      options
    );
    const tree$ = (cmpRule(host, context) as Observable<Tree>).pipe(
      tap((tree) => {
        const templatePath = tree.actions.find(
          (action) => !!action.path.match(/component.html/)
        ).path;
        tree.overwrite(templatePath, template);
      })
    );

    return tree$;
  };
}
