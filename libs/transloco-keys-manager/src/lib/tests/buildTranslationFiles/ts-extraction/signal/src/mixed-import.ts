import { TranslocoService, translateSignal } from '@jsverse/transloco';

@Component({
  selector: 'bla-bla',
  template: `
    <table>
      <tr>
        <th>displayedTitle()</th>
      </tr>
      <tr>
        <th *ngFor="let column of displayedColumns()">
          {{ column }}
        </th>
      </tr>
    </table>
  `,
})
export class Basic {
  transloco = inject(TranslocoService);

  displayedTitle = translateSignal('title3');
  displayedColumns = translateSignal(['username3', 'password3']);
}
