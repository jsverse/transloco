import { marker } from '@jsverse/transloco-keys-manager/marker';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'marker-with-scope-test',
  template: ` <p *ngFor="let entry of textEntires">{{ entry }}</p> `,
  providers: [provideTranslocoScope(['scope', 'nested/scope'])],
})
export class MarkerWithScopeTestComponent {
  readonly textEntires = [
    marker('marker_with_scope_username', undefined, 'scope'),
    marker('marker_with_scope_password', undefined, 'nested/scope'),
  ];
}
