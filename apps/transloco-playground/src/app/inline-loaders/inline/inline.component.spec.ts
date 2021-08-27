import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { InlineComponent } from './inline.component';
import { getTranslocoModule } from '../../transloco-testing.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

describe('InlineComponent', () => {
  let component: InlineComponent;
  let fixture: ComponentFixture<InlineComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [getTranslocoModule()],
        declarations: [InlineComponent],
        providers: [
          {
            provide: TRANSLOCO_SCOPE,
            useValue: { scope: 'inline' },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
