import { AppComponent } from './app.component';
import { createTestComponentFactory, Spectator } from '@netbasal/spectator';
import { providersMock } from '../../projects/transloco/src/lib/tests/transloco.mocks';
import { RouterModule } from '@angular/router';
import { MockModule } from 'ng-mocks';

describe('AppComponent', () => {
  let host: Spectator<AppComponent>;
  const createHost = createTestComponentFactory({
    component: AppComponent,
    imports: [MockModule(RouterModule)],
    providers: providersMock
  });
  beforeEach(() => {
    host = createHost();
  });

  it('should be defined', () => {
    expect(host.component).toExist();
  });
});
