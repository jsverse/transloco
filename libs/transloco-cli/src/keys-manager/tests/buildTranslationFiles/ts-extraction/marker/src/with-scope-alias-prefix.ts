import { marker } from '@jsverse/transloco-keys-manager/marker';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'marker-with-scope-alias-prefix-test',
  template: `
    @for (entry of textEntries; track entry) {
      <p>{{ entry }}</p>
    }
  `,
  providers: [provideTranslocoScope('marker-prefixed')],
})
export class MarkerWithScopeAliasPrefixTestComponent {
  readonly textEntries = [marker('markerPrefixed.marker_with_alias_prefix')];
}
