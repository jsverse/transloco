import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocaleComponent } from './locale.component';

describe('LocaleComponent', () => {
  let component: LocaleComponent;
  let fixture: ComponentFixture<LocaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LocaleComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
