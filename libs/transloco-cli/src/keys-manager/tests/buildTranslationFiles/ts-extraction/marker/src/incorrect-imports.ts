import { marker } from 'incorrect-import';

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
export class TableComponent {
  data = [
    { username3: 'alex', password3: '12345678' },
    { username3: 'bob', password3: 'password' },
  ];
  displayedColumns = [marker('username3'), marker('password3')];
}
