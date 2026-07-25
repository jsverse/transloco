import { translateSignal as tS } from '@jsverse/transloco';

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
  displayedTitle = tS('title2');
  displayedColumns = tS(['username2', 'password2']);
}
