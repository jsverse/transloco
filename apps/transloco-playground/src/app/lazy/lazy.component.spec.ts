import { waitForAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { provideTranslocoScope } from '@jsverse/transloco';

import { providePlaygroundTranslocoTesting } from '../transloco-testing.module';

import LazyComponent from './lazy.component';

describe('LazyComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslocoScope('admin-page'),
        providePlaygroundTranslocoTesting(),
      ],
    }).compileComponents();
  }));

  it('should get scoped title translation', function () {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.admin-title')).nativeElement
        .innerText,
    ).toBe('Admin spanish');
  });

  it('should get scoped translation with prefix', function () {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.admin-prefix')).nativeElement
        .innerText,
    ).toBe('Admin prefix spanish');
  });
});
