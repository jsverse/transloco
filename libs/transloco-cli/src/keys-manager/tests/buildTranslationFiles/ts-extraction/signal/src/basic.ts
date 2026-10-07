import { translateSignal } from '@jsverse/transloco';

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
  displayedTitle = translateSignal('title');
  displayedColumns = translateSignal(['username', 'password']);
}
