import { marker } from '@jsverse/transloco-keys-manager/marker';

@Component({
  selector: 'bla-bla',
  template: `
    <table>
      <tr>
        <th *ngFor="let column of displayedColumns">
          {{ column | transloco }}
        </th>
      </tr>
      <tr *ngFor="let row of data">
        <td *ngFor="let column of displayedColumns">
          {{ row[column] }}
        </td>
      </tr>
    </table>
  `,
})
export class Basic {
  data = [
    { username: 'alex', password: '12345678' },
    { username: 'bob', password: 'password' },
  ];
  displayedColumns = [marker('username'), marker('password')];
}
