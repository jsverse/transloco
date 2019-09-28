import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TRANSLOCO_SCOPE, TranslocoTestingModule } from '@ngneat/transloco';
import { By } from '@angular/platform-browser';
import en from '../../assets/i18n/en.json';
import admin from '../../assets/i18n/admin-page/en.json';
import { LazyComponent } from './lazy.component';

describe('LazyComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'admin-page' }],
      imports: [
        RouterTestingModule,
        TranslocoTestingModule.withLangs(
          {
            en,
            'admin-page/en': admin
          },
          {
            defaultLang: 'en'
          }
        )
      ],
      declarations: [LazyComponent]
    }).compileComponents();
  }));

  it('should work', function() {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.admin-title')).nativeElement.innerText).toBe('Admin english');
  });
});
