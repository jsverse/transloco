import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LazyMultipleScopesComponent } from './lazy-multiple-scopes.component';

describe('LazyMultipleScopesComponent', () => {
  let component: LazyMultipleScopesComponent;
  let fixture: ComponentFixture<LazyMultipleScopesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LazyMultipleScopesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LazyMultipleScopesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
