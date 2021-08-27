import { waitForAsync, TestBed } from '@angular/core/testing';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { By } from '@angular/platform-browser';

import { LazyComponent } from './lazy.component';
import { getTranslocoModule } from '../transloco-testing.module';

describe('LazyComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'admin-page' }],
        imports: [getTranslocoModule()],
        declarations: [LazyComponent],
      }).compileComponents();
    })
  );

  it('should get scoped title translation', function () {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.admin-title')).nativeElement.innerText
    ).toBe('Admin spanish');
  });

  it('should get scoped translation with read', function () {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.admin-read')).nativeElement.innerText
    ).toBe('Admin read spanish');
  });
});
