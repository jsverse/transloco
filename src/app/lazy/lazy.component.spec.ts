import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TRANSLOCO_SCOPE, TranslocoTestingModule } from '@ngneat/transloco';
import { By } from '@angular/platform-browser';
import en from '../../assets/i18n/en.json';
import es from '../../assets/i18n/es.json';
import admin from '../../assets/i18n/admin-page/en.json';
import adminSpanish from '../../assets/i18n/admin-page/es.json';
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
            es,
            'admin-page/en': admin,
            'admin-page/es': adminSpanish
          },
          {
            defaultLang: 'es'
          }
        )
      ],
      declarations: [LazyComponent]
    }).compileComponents();
  }));

  it('should get scoped title translation', function() {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.admin-title')).nativeElement.innerText).toBe('Admin spanish');
  });
  it('should get scoped translation with read', function() {
    const fixture = TestBed.createComponent(LazyComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.admin-read')).nativeElement.innerText).toBe('Admin read spanish');
  });
});
