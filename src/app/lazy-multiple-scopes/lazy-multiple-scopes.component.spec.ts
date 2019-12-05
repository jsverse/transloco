import { LazyMultipleScopesComponent } from './lazy-multiple-scopes.component';
import { TRANSLOCO_SCOPE, TranslocoService } from '@ngneat/transloco';
import { getTranslocoModule } from '../transloco-testing.module';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

describe('LazyMultipleScopesComponent', () => {
  let spectator: Spectator<LazyMultipleScopesComponent>;

  let createComponent = createComponentFactory({
    providers: [
      { provide: TRANSLOCO_SCOPE, useValue: { scope: 'admin-page', alias: 'AdminPageAlias'}, multi: true},
      { provide: TRANSLOCO_SCOPE, useValue: { scope: 'lazy-page', alias: 'LazyPageAlias' }, multi: true}
    ],
    imports: [getTranslocoModule({
      reRenderOnLangChange: true
    })],
    component: LazyMultipleScopesComponent
  });

  beforeEach(() => (spectator = createComponent()));

  it('should read two scopes on the same component', () => {
    spectator.fixture.detectChanges();
    expect(spectator.query('.admin-page-title')).toHaveText('Admin spanish');
    expect(spectator.query('.lazy-page-title')).toHaveText('Admin Lazy spanish');
    const service = spectator.get(TranslocoService);
    service.setActiveLang('en');
    spectator.detectChanges();
    expect(spectator.query('.admin-page-title')).toHaveText('Admin english');
    expect(spectator.query('.lazy-page-title')).toHaveText('Admin Lazy english');
  });
});
