import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'admin-page',
  template: `<router-outlet></router-outlet>`,
  providers: [provideTranslocoScope('admin')],
})
export class AdminPage {}
