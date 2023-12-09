import { waitForAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { getTranslocoModule } from '../transloco-testing.module';

import { LazyComponent } from './lazy.component';

describe('LazyComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'admin-page' }],
      imports: [getTranslocoModule()],
      declarations: [LazyComponent],
    }).compileComponents();
  }));

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
