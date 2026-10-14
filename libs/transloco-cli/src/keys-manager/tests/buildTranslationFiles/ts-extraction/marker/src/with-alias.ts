import { marker as t } from '@jsverse/transloco-keys-manager/marker';

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
    { username4: 'alex', password4: '12345678' },
    { username4: 'bob', password4: 'password' },
  ];
  displayedColumns = [t('username4'), t('password4')];
}
